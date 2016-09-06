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

// Start the PubSub feed
function startPullingFromPubSub() {
    keepFetching = true
    window.setTimeout(checkForTaxiRidesOnPubSub, 0)
    concurrentpulls++
}

// Stop the PubSub feed
function stopPullingFromPubSub() {
    keepFetching = false
    concurrentpulls = 0
}

// Send a request to PubSub and process response
function checkForTaxiRidesOnPubSub() {
    if (!keepFetching)
        return;
    else {
        var now = Date.now()
        // relaunch additional concurrent requests if they seem to have been successful in the past and within the MAXCONCURRENT limit
        for (var i = 0; concurrentpulls < PUBSUB_MAXCONCURRENT && now - lastpullsuccess < PUBSUB_RETRY_PERIOD; i++) {
            window.setTimeout(checkForTaxiRidesOnPubSub, 100 * i);
            concurrentpulls++
        }
    }

    var request = pubsub.projects.subscriptions.pull({
        subscription: PUBSUB_SUBSCRIPTION,
        max_messages: PUBSUB_MAXMESSAGES
    })

    request.execute(function (resp) {
        if (concurrentpulls > 0)
            concurrentpulls--
        var now = Date.now()
        lastpullsuccess = now
        var ackIds = []
        if ('receivedMessages' in resp && resp.receivedMessages.length > 0) {
            // parse messages
            var messages = resp.receivedMessages.map(function (msg) {return JSON.parse(window.atob(msg.message.data))})
            // get ackIds
            var ackIds = resp.receivedMessages.map(function (msg) {return msg.ackId})
            // acknowledge received points with PubSub
            ackReceivedMessages(ackIds)

            // check the format
            // if the ride_id field is present: we have individual rides
            // if the ntaxis field is present: we have aggregated rides
            var rideidmessages = messages.filter(function (msg) {return "ride_id" in msg})
            var ntaxismessages = messages.filter(function (msg) {return "ntaxis" in msg})
            var dollarmessages = messages.filter(function (msg) {return "dollar_run_rate_per_minute" in msg})
            var exactdmessages = messages.filter(function (msg) {return "dollar_turnover" in msg})
            // timestamps are optional in all messages or can be sent individually
            var timestmessages = messages.filter(function (msg) {return "timestamp" in msg})

            // handle messages of the format
            // {
            //    ride_id
            //    latitude
            //    longitude
            //    ride_status
            // }
            if (rideidmessages.length > 0) {
                // get the list of unique ride IDs in this batch of points
                var rideIds = {}
                rideidmessages.forEach(function (msg) { rideIds[msg.ride_id] = 0 })
                var updatedpoints = taxipoints.filter(function (pt) {return pt.ride_id in rideIds})
                var otherpoints   = taxipoints.filter(function (pt) {return !(pt.ride_id in rideIds)})
                // decrement the weight of rideIds that will receive updated positions
                updatedpoints.forEach(function(pt) {
                    pt.weight--
                })
                // remove rideIds that now have a zero weight
                oldpoints = updatedpoints.filter(function (pt) { return pt.weight > 0 }).concat(otherpoints)
                // create new points
                var newpoints = rideidmessages.map(function (msg) {
                    var loc = {}
                    loc.location = new google.maps.LatLng(msg.latitude, msg.longitude)
                    loc.weight = TAXIPOINT_HEADWEIGHT
                    loc.ride_id = msg.ride_id
                    loc.jstimestamp = now
                    datastatusRegister(msg)
                    if (msg.ride_status == "dropoff")
                        datastatusDone(msg.ride_id)
                    return loc
                })
                // send the points to the heatmap
                taxipoints = oldpoints.concat(newpoints)
            }

            // handle messages of the format
            // {
            //    ntaxis
            //    latitude
            //    longitude
            // }
            if (ntaxismessages.length > 0) {
                // create new points
                var newpoints = ntaxismessages.map(function (msg) {
                    var loc = {}
                    loc.location = new google.maps.LatLng(msg.latitude, msg.longitude)
                    if ("ntaxis" in msg) {
                        loc.weight = msg.ntaxis * TAXIPOINT_HEADWEIGHT
                        ntaxisAvg.add(msg.ntaxis)
                    }
                    loc.jstimestamp = now
                    return loc
                })
                // send the points to the heatmap
                taxipoints = taxipoints.concat(newpoints)
            }

            // handle messages of the format
            // {
            //    dollar_run_rate_per_minute
            // }
            dollarmessages.forEach(function (msg) {
                setDollarDisplay(msg.dollar_run_rate_per_minute)
            })

            // handle messages of the format
            // {
            //    dollar_turnover
            //    dollar_window
            //    dollar_timing
            // }
            exactdmessages.forEach(function (msg) {
                updateExactDollars(msg.dollar_turnover, msg.dollar_window, msg.dollar_timing)
            })

            // adjust clock if timestamp data exists
            if (timestmessages.length > 0) {
                var times = timestmessages.map(function (msg) {
                    return Date.parse(msg.timestamp)
                })
                var max = Math.max.apply(null, times)
                maxTime = Math.max(maxTime, max)
                setClock(clock, new Date(maxTime))
            }
        }
    });
}

// Acknowledge messages with PubSub
// and relaunch new PubSub requets within concurrency limit once the acknowledgments are done
function ackReceivedMessages(ackIds) {
    var now = Date.now()
    if (ackIds.length > 0) {
        // check ackIds for duplicates
        var nduplicates = 0
        ackIds.forEach(function (id) {
            if (id in duplichecks) {
                nduplicates++
            } else {
                duplichecks[id] = now
            }
        })
        console.log("Received " + ackIds.length + " PubSub messages ")
        //statistics
        saturatedPts.add(ackIds.length == PUBSUB_MAXMESSAGES)
        dataratePts.add(ackIds.length)
        datarateTimes.add(now)
        if (nduplicates > 0)
            console.warn("Found " + nduplicates + " duplicates in this batch. PubSub is re-sending.")
        duplicatePts.add(nduplicates)

        var request = pubsub.projects.subscriptions.acknowledge({
            subscription: PUBSUB_SUBSCRIPTION,
            ackIds: ackIds
        });

        request.execute(function (resp) {
            // get new points as soon as last batch acknowledged
            if (concurrentpulls < PUBSUB_MAXCONCURRENT) {
                window.setTimeout(checkForTaxiRidesOnPubSub, 100);
                concurrentpulls++
            }
        })
    }
}