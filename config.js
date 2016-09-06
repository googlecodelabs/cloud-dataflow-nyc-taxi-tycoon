/**
 * Copyright 2016 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var TAXIPOINT_HEADWEIGHT = 5 // each taxi appears as 5 points of weights 5, 3, 2, 1

var HEATMAP_UPDATE_PERIOD = 250 // fade the weights of old points on the map by a unit every 1 second, keep head points
var TAXIPOINT_FADEOUT_PERIOD = 5000 // start fading all points, including head points, after 5 sec
var TAXIPOINT_GROUP_FADEOUT_PERIOD = 5000 // start fading out aggregated points after 1s

var DUPLICHECK_PERIOD = 30000 // keep ckecking ackIds for duplicates for 30 sec after first arrival
var DUPLICKECK_CLEANING_PERIOD = 1333 // check duplicates database for old entries to clean every 1.3 sec

var PUBSUB_SUBSCRIPTION_NAME = 'nytt-visualizer-web-028368'
var PUBSUB_SUBSCRIPTION = 'projects/pubsub-public-data/subscriptions/web'
var PUBSUB_MAXMESSAGES = 1000 // number of messages to get from PubSub at once
var PUBSUB_MAXCONCURRENT = 5 // number of concurrent requests to PubSub
var PUBSUB_RETRY_PERIOD = 2000 // retry before the 90sec timeout to make system responsive to new data

var DASHBOARD_UPDATE_PERIOD = 400 // dashboard update frequency in ms
var DASHBOARD_NODATA_MSG_AFTER = 6000 // dashboard displays "no data" after 6 seconds without data
var DASBOARD_DATASTATUS_VIEW_SCROLL_PERIOD = 1000 // min time required before datastatus debug view can scroll