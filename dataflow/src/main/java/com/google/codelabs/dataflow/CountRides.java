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
import com.google.cloud.dataflow.sdk.transforms.*;
import com.google.cloud.dataflow.sdk.transforms.windowing.FixedWindows;
import com.google.cloud.dataflow.sdk.transforms.windowing.Window;
import com.google.cloud.dataflow.sdk.values.KV;
import com.google.codelabs.dataflow.utils.CustomPipelineOptions;
import com.google.codelabs.dataflow.utils.LatLon;
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
// mvn exec:java -Dexec.mainClass="com.google.codelabs.dataflow.CountRides" -e -Dexec.args="<your arguments>"

@SuppressWarnings("serial")
public class CountRides {
  private static final Logger LOG = LoggerFactory.getLogger(CountRides.class);

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

  private static class MarkRides extends SimpleFunction<TableRow, KV<LatLon, TableRow>> {

    @Override
    public KV<LatLon, TableRow> apply(TableRow t) {
      float lat = Float.parseFloat(t.get("latitude").toString());
      float lon = Float.parseFloat(t.get("longitude").toString());
      final float PRECISION = 0.005f; // very approximately 500m
      float roundedLat = (float) Math.floor(lat / PRECISION) * PRECISION + PRECISION / 2;
      float roundedLon = (float) Math.floor(lon / PRECISION) * PRECISION + PRECISION / 2;
      LatLon key = new LatLon(roundedLat, roundedLon);

      return KV.of(key, t);
    }
  }

  private static class TransformRides extends SimpleFunction<KV<LatLon, Long>, TableRow> {

    @Override
    public TableRow apply(KV<LatLon, Long> ridegrp) {
      TableRow result = new TableRow();
      result.set("latitude", ridegrp.getKey().lat);
      result.set("longitude", ridegrp.getKey().lon);
      result.set("ntaxis", ridegrp.getValue());

      return result;
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

     .apply("window 1s", Window.into(FixedWindows.of(Duration.standardSeconds(1))))
     .apply("mark rides", MapElements.via(new MarkRides()))
     .apply("count similar", Count.perKey())
     .apply("format rides", MapElements.via(new TransformRides()))

     .apply(PubsubIO.Write.named("WriteToPubsub")
        .topic(String.format("projects/%s/topics/%s", options.getSinkProject(), options.getSinkTopic()))
        .withCoder(TableRowJsonCoder.of()));

    p.run();
  }
}
