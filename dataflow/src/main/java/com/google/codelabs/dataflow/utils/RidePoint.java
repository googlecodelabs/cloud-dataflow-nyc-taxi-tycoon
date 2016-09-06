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

package com.google.codelabs.dataflow.utils;

import com.google.api.services.bigquery.model.TableRow;
import com.google.cloud.dataflow.sdk.coders.AvroCoder;
import com.google.cloud.dataflow.sdk.coders.DefaultCoder;
import java.time.Instant;
import java.time.format.DateTimeFormatter;

@DefaultCoder(AvroCoder.class)
public class RidePoint {
  public RidePoint() {}

  public RidePoint(String key) {
    rideId = key;
  }

  public RidePoint(RidePoint p) {
    rideId = p.rideId;
    timestamp = p.timestamp;
    lat = p.lat;
    lon = p.lon;
    status = p.status;
  }

  public RidePoint(TableRow r) {
    lat = Float.parseFloat(r.get("latitude").toString());
    lon = Float.parseFloat(r.get("longitude").toString());
    rideId = r.get("ride_id").toString();
    status = r.get("ride_status").toString();
    timestamp =
        Instant.from(DateTimeFormatter.ISO_DATE_TIME.parse(r.get("timestamp").toString()))
            .toEpochMilli();
  }

  public TableRow toTableRow() {
    TableRow result = new TableRow();
    result.set("latitude", lat);
    result.set("longitude", lon);
    result.set("ride_id", rideId);
    result.set("timestamp", Instant.ofEpochMilli(timestamp).toString());
    result.set("ride_status", status);
    return result;
  }

  public String rideId;
  public long timestamp;
  public float lat;
  public float lon;
  public String status;
}
