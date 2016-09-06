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

// Every second fade points on the map by a unit and update the map
function displayTaxiHeatmap() {
    var now = Date.now()
    var weights = taxipoints.map(function(pt) {return pt.weight})
    var maxweight = Math.max.apply(null, weights)
    var minweight = Math.floor(maxweight/20)
    var newtaxipoints = taxipoints.map(function (pt) {
        if (Math.random() < 0.9) { // do not update everything otherwise the heatmap tones everything up again
            if ("ride_id" in pt) {
                if (pt.weight < TAXIPOINT_HEADWEIGHT)
                    pt.weight--
                else if (now - pt.jstimestamp > TAXIPOINT_FADEOUT_PERIOD)
                    pt.weight--
            }
            else {
                if (now - pt.jstimestamp > TAXIPOINT_GROUP_FADEOUT_PERIOD)
                    pt.weight = Math.floor(4 * pt.weight / 5)
            }
        }
        return pt
    })
    // remove rideIds that now have a zero weight or that are too old
    taxipoints = newtaxipoints.filter(function(pt) {return pt.weight > minweight})
    // put the new points on the map
    if (heatmap)
        heatmap.setData(taxipoints);
    console.log("Points on the map: " + taxipoints.length)
    window.setTimeout(displayTaxiHeatmap, HEATMAP_UPDATE_PERIOD)
}
window.setTimeout(displayTaxiHeatmap, 0)

// Every 1.3 seconds, check the duplicated database for entries older than 30 sec and delete them
function fadeDuplickecks() {
    var n = 0
    var p = 0
    var now = Date.now()
    for (var key in duplichecks) {
        if (!duplichecks.hasOwnProperty(key)) continue;
        n++
        if (now - duplichecks[key] > DUPLICHECK_PERIOD) {
            delete duplichecks[key]
            p++
        }
    }
    window.setTimeout(fadeDuplickecks, DUPLICKECK_CLEANING_PERIOD)
}
window.setTimeout(fadeDuplickecks, 0)

// periodically log ntaxis
function logNTaxis() {
    var avg = ntaxisAvg.getAverage()
    if (avg > 0)
        console.log("Rides are aggregated in bundles of " + avg + " on average")
    window.setTimeout(logNTaxis, 2000)
}
window.setTimeout(logNTaxis, 0)

function datarateUpdate() {
    var now = Date.now()
    var timespan = datarateTimes.getSpan() / 1000.0
    if (timespan == 0)
        timespan = 1 // to avoid div by 0
    // integer data rate unless it is less than 1
    var datarate = Math.round(dataratePts.getSum()*10 / timespan)/10
    datarate = (datarate >= 1) ? Math.round(datarate) : datarate
    var overload = saturatedPts.getAverage() > 0.5
    var severe = duplicatePts.getAverage() > 0
    var nothing = datarate == 0 || now - datarateTimes.getMax() > DASHBOARD_NODATA_MSG_AFTER // no data or stale stats
    if (nothing)
        setDataStatus(DATA_STATUS_ZERO, datarate)
    else if (severe)
        setDataStatus(DATA_STATUS_RATE_SEVEREOVERLOAD, datarate)
    else if (overload)
        setDataStatus(DATA_STATUS_RATE_OVERLOAD, datarate)
    else
        setDataStatus(DATA_STATUS_RATE, datarate)
    window.setTimeout(datarateUpdate, DASHBOARD_UPDATE_PERIOD)
}
window.setTimeout(datarateUpdate, 0)

function relaunchPubSubReq() {
    var now = Date.now()
    if (keepFetching &&  now - lastpullsuccess > PUBSUB_RETRY_PERIOD) {
        // retry regardless of concurrent pull counts
        window.setTimeout(checkForTaxiRidesOnPubSub, 0)
        concurrentpulls++
    }
    window.setTimeout(relaunchPubSubReq, PUBSUB_RETRY_PERIOD)
}
window.setTimeout(relaunchPubSubReq, 0)

// debug: set clock to follow system time
// function syncClock() {
//     var clock = document.querySelector("#clock svg")
//     setClock(clock, new Date())
//     window.setTimeout(syncClock, 1000)
// }
// window.setTimeout(syncClock, 0)
