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

var authPromise
var taxipoints = []
var duplichecks = {}
var datastatus = []
var datastatusstart = []
var datastatusdone = []
var datastatusmax = -1
var datastatus_lastscrolltime=0
var keepFetching = false
var concurrentpulls = 0
var lastpullsuccess = 0

// movinga average stats
var ntaxisAvg = new SlidingSet(10000)
var saturatedPts = new SlidingSet(15)
var dataratePts = new SlidingSet(15)
var datarateTimes = new SlidingSet(15)
var duplicatePts = new SlidingSet(15)
var maxTime = 0

// Google maps API heatmap instance
var heatmap = null

// Google PubSub API instance
var pubsub

// Google CloudResourcManager API instance
var crm
