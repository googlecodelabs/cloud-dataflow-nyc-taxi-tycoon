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

var canvas = queryIfDisplayed("#missingdata")
var ctx = canvas ? canvas.getContext("2d") : null
datastatusClearAll()

DATASTATUS_POINTSIZE = 2
DATASTATUS_NBLINES = 100

function datastatusPaintReceived(x, y, b) {
    if (!ctx) return
    ctx.beginPath();
    ctx.fillStyle = "green"
    ctx.globalAlpha = 1
    ctx.rect(x, DATASTATUS_POINTSIZE*y, 1, DATASTATUS_POINTSIZE)
    ctx.fill()
    if (b) {
        ctx.beginPath();
        ctx.fillStyle = "white"
        ctx.globalAlpha = 0.7
        ctx.rect(x, DATASTATUS_POINTSIZE*y, 1, DATASTATUS_POINTSIZE)
        ctx.fill()
    }

}

function datastatusClearAll() {
    if (!ctx) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function datastatusClear(y) {
    if (!ctx) return
    ctx.beginPath();
    ctx.fillStyle = "white"
    ctx.globalAlpha = 0.7
    ctx.rect(0, DATASTATUS_POINTSIZE*y, ctx.canvas.width, DATASTATUS_POINTSIZE)
    ctx.fill()
}

function datastatusDone(id) {
    if (id in datastatus && datastatus[id]>0) {
        datastatusClear(datastatus[id])
        datastatusdone[datastatus[id]] = true
    }
}

function datastatusScrollUp() {
    if (!ctx) return false

    // only scroll up one per second
    var now = Date.now()
    if (now - datastatus_lastscrolltime < DASBOARD_DATASTATUS_VIEW_SCROLL_PERIOD)
        return false
    datastatus_lastscrolltime = now

    var newdatastatusstart = []
    var newdatastatusdone = []
    for (var line in datastatus) {
        if (!datastatus.hasOwnProperty(line)) continue;
        var oldstart = datastatusstart[datastatus[line]]
        var olddone =  datastatusdone[datastatus[line]]
        datastatus[line]--
        if (datastatus[line] > 0) {
            newdatastatusstart[datastatus[line]] = oldstart
            newdatastatusdone[datastatus[line]] = olddone
        }
        // cleanup of very old entries
        if (datastatus[line]<-500)
            delete datastatus[line]
    }
    datastatusstart = newdatastatusstart
    datastatusdone = newdatastatusdone

    var img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.putImageData(img, 0, -DATASTATUS_POINTSIZE);
    return true;
}

function datastatusRegister(msg) {
    if (!ctx) return

    if ("ride_id" in msg && "point_idx" in msg) {
        var id = msg.ride_id
        if (!(id in datastatus)) {
            if (datastatusmax == DATASTATUS_NBLINES-1) {
                var ok = datastatusScrollUp()
                if (!ok)
                    return // don't display this value if there is no space on the screen
                else
                    datastatusmax--
            }
            datastatusmax++
            datastatusstart[datastatusmax] = msg.point_idx
            datastatusdone[datastatusmax] = false // not finished yet
            datastatus[id] = datastatusmax
        }
        if (id in datastatus && datastatus[id]>=0)
            datastatusPaintReceived(msg.point_idx-datastatusstart[datastatus[id]], datastatus[id], datastatusdone[datastatus[id]])
    }
}