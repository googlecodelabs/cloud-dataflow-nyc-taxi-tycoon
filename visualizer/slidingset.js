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

// classes
function SlidingSet(max) {
    this.init(max)
}
SlidingSet.prototype.add = function(x) {
    this.data[this.p++] = x
    if (this.p >= this.data.length) this.p = 0
    if (this.n < this.data.length) this.n++
}
SlidingSet.prototype.getSum = function() {
    var sum = this.data.reduce(function (sum, val) {return sum + val})
    return sum
}
SlidingSet.prototype.getAverage = function() {
    return this.getSum() / this.n
}
SlidingSet.prototype.getSpan = function() {
    var min = this.getMin()
    var max = this.getMax()
    return max-min
}
SlidingSet.prototype.getMin = function() {
    var min = Math.min.apply(null, this.data.slice(0, Math.max(this.p, this.n)))
    return min
}
SlidingSet.prototype.getMax = function() {
    var max = Math.max.apply(null, this.data.slice(0, Math.max(this.p, this.n)))
    return max
}
SlidingSet.prototype.init = function(max) {
    this.data = new Array(max).fill(0)
    this.n = 0 // number of items
    this.p = 0 // head item pointer
}
SlidingSet.prototype.clear = function() {
    this.init(this.data.length)
}