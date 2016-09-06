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
import com.google.cloud.dataflow.sdk.transforms.DoFn;
import com.google.cloud.dataflow.sdk.transforms.ParDo;
import com.google.codelabs.dataflow.utils.CustomPipelineOptions;
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
// mvn exec:java -Dexec.mainClass="com.google.codelabs.dataflow.FilterRides" -e -Dexec.args="<your arguments>"

@SuppressWarnings("serial")
public class FilterRides {
  private static final Logger LOG = LoggerFactory.getLogger(FilterRides.class);

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

  private static class FilterLowerManhattan extends DoFn<TableRow, TableRow> {
    FilterLowerManhattan() {}

    @Override
    public void processElement(ProcessContext c) {
      TableRow ride = c.element();

      // filter rides in lower Manhattan only
      float lat = Float.parseFloat(ride.get("latitude").toString());
      float lon = Float.parseFloat(ride.get("longitude").toString());
      if (lon > -74.747 && lon < -73.969)
        if (lat > 40.699 && lat < 40.720) {
          c.output(ride);
          LOG.info("Accepted ride lat: {} lon: {} ", lat, lon);
          return;
        }
    }
  }

  public static void main(String[] args) {
    CustomPipelineOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(CustomPipelineOptions.class);
    Pipeline p = Pipeline.create(options);

    p.apply(PubsubIO.Read.named("read from PubSub")
        .topic(String.format("projects/%s/topics/%s", options.getSourceProject(), options.getSourceTopic()))
        .timestampLabel("ts")
        .withCoder(TableRowJsonCoder.of()))

     .apply("filter lower Manhattan", ParDo.of(new FilterLowerManhattan()))

     .apply(PubsubIO.Write.named("WriteToPubsub")
        .topic(String.format("projects/%s/topics/%s", options.getSinkProject(), options.getSinkTopic()))
        .withCoder(TableRowJsonCoder.of()));
    p.run();
  }
}
