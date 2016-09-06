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

var DATE_DISPLAY_IDX = 3
var HOUR_HAND_IDX = 5
var MIN_HAND_IDX = 7
var SEC_HAND_IDX = 9

function setClock(clock, date) {
    if (clock) {
        var hour = date.getHours()
        var min = date.getMinutes()
        var sec = date.getSeconds()
        var day = date.getDay()
        var hours = day * 24 + hour
        var mins = hours * 60 + min
        var secs = mins * 60 + sec
        clock.childNodes.item(HOUR_HAND_IDX).style.transform = "rotate(%deg)".replace("%", hours / 12.0 * 360)
        clock.childNodes.item(MIN_HAND_IDX).style.transform = "rotate(%deg)".replace("%", mins / 60.0 * 360)
        clock.childNodes.item(SEC_HAND_IDX).style.transform = "rotate(%deg)".replace("%", secs / 60.0 * 360)
        var year = date.getFullYear()
        var month = date.getMonth() + 1
        var dayinm = date.getDate()
        clock.childNodes.item(DATE_DISPLAY_IDX).textContent = year + "-" + month + "-" + dayinm
    }
}

var clock = queryIfDisplayed("#clock svg")

if (clock) {
    // draw numbers
    for (var i = 0; i < 12; i++) {
        var R = 63
        var number = document.createElementNS("http://www.w3.org/2000/svg", 'text')
        var transformStr = "translate(%x, %y)".replace("%x", Math.cos((i + 1) / 12.0 * 2 * Math.PI - Math.PI / 2) * R).replace("%y", Math.sin((i + 1) / 12.0 * 2 * Math.PI - Math.PI / 2) * R)
        number.setAttribute("text-anchor", "middle")
        number.setAttribute("dy", "0.3em")
        number.setAttribute("transform", transformStr)
        number.textContent = i + 1
        clock.appendChild(number)
    }
    //draw ticks
    for (var i = 0; i < 60; i++) {
        var L = 8
        var l = 5
        var R = 79
        var tick = document.createElementNS("http://www.w3.org/2000/svg", 'line')
        var transformStr = "rotate(%a)".replace("%a", (i + 1) / 60.0 * 360 - 90)
        tick.setAttribute("transform", transformStr)
        if ((i + 1) % 5)
            tick.setAttribute("x1", R - l)
        else
            tick.setAttribute("x1", R - L)
        tick.setAttribute("y1", 0)
        tick.setAttribute("x2", R)
        tick.setAttribute("y2", 0)
        tick.setAttribute("class", "tick")
        clock.appendChild(tick)
    }
}