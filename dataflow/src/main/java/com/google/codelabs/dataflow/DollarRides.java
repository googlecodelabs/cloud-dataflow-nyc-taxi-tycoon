/*
 * Copyright (C) 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.codelabs.dataflow;

import com.google.api.services.bigquery.model.TableRow;
import com.google.cloud.dataflow.sdk.Pipeline;
import com.google.cloud.dataflow.sdk.coders.TableRowJsonCoder;
import com.google.cloud.dataflow.sdk.io.PubsubIO;
import com.google.cloud.dataflow.sdk.options.PipelineOptionsFactory;
import com.google.cloud.dataflow.sdk.transforms.MapElements;
import com.google.cloud.dataflow.sdk.transforms.Sum;
import com.google.cloud.dataflow.sdk.transforms.windowing.SlidingWindows;
import com.google.cloud.dataflow.sdk.transforms.windowing.Window;
import com.google.cloud.dataflow.sdk.values.TypeDescriptor;
import com.google.codelabs.dataflow.utils.CustomPipelineOptions;
import java.util.Date;
import org.joda.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// Dataflow command-line options must be specified:
//   --project=<your project ID>
//   --sinkProject=<your project ID>
//   --stagingLocation=gs://<your staging bucket>
//   --runner=DataflowPipelineRunner
//   --streaming=true
//   --numWorkers=3
//   --zone=<your compute zone>
// You can launch the pipeline from the command line using:
// mvn exec:java -Dexec.mainClass="com.google.codelabs.dataflow.DollarRides" -e -Dexec.args="<your arguments>"

@SuppressWarnings("serial")
public class DollarRides {
  private static final Logger LOG = LoggerFactory.getLogger(DollarRides.class);

  // ride format from PubSub
  // {
  // "ride_id":"a60ba4d8-1501-4b5b-93ee-b7864304d0e0",
  // "latitude":40.66684000000033,
  // "longitude":-73.83933000000202,
  // "timestamp":"2016-08-31T11:04:02.025396463-04:00",
  // "meter_reading":14.270274,
  // "meter_increment":0.019336415,
  // "ride_status":"enroute",
  // "passenger_count":2
  // }

  public static void main(String[] args) {
    CustomPipelineOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(CustomPipelineOptions.class);
    Pipeline p = Pipeline.create(options);

    p.apply(PubsubIO.Read.named("read from PubSub")
        .topic(String.format("projects/%s/topics/%s", options.getSourceProject(), options.getSourceTopic()))
        .timestampLabel("ts")
        .withCoder(TableRowJsonCoder.of()))

     .apply("sliding window",
        Window.into(
          SlidingWindows.of(Duration.standardSeconds(60)).every(Duration.standardSeconds(3))))

     .apply("extract meter increment",
        MapElements.via((TableRow x) -> Double.parseDouble(x.get("meter_increment").toString()))
          .withOutputType(TypeDescriptor.of(Double.class)))

     .apply("sum whole window", Sum.doublesGlobally().withoutDefaults())
     .apply("format rides",
        MapElements.via(
          (Double x) -> {
            TableRow r = new TableRow();
            r.set("dollar_run_rate_per_minute", x);
            LOG.info("Outputting $ value {} at {} ", x, new Date().getTime());
            return r;
          })
        .withOutputType(TypeDescriptor.of(TableRow.class)))

     .apply(PubsubIO.Write.named("WriteToPubsub")
        .topic(String.format("projects/%s/topics/%s", options.getSinkProject(), options.getSinkTopic()))
        .withCoder(TableRowJsonCoder.of()));
    p.run();
  }
}
