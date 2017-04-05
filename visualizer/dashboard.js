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

// all button event handlers
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

var startFetchingRidesButton = document.getElementById('start-fetching-button');
var stopFetchingRidesButton = document.getElementById('stop-fetching-button');
var projectsSelect = document.getElementById('project-selection');
var topicsSelect = document.getElementById('pubsub-topic-selection');

// display for data overflow
var dataStatus = queryIfDisplayed('#data-status .msg');
var DATA_STATUS_ZERO = "Not receiving any data."
var DATA_STATUS_RATE = "Receiving %% data points/s."
var DATA_STATUS_RATE_OVERLOAD = "Overload: unable to read data fast enough (%% data points/s)."
var DATA_STATUS_RATE_SEVEREOVERLOAD = "Severe overload (%% data points/s). PubSub is re-sending."

function setDataStatus(msg, datarate) {
    if (dataStatus)
        dataStatus.innerHTML = msg.replace("%%", datarate)
}

function setDollarDisplay(amount) {
    var node = queryIfDisplayed("#dollar-display")
    if (node) {
        node.innerText = formatDollars(amount)
    }
}

function updateExactDollars(amount, id, timing) {
    var existing = queryIfDisplayed("#exact-dollar-display div#windowhash-" + id)
    if (existing) {
        setExactDollarNode(existing, amount, id, timing)
    } else {
        var node = queryIfDisplayed("#exact-dollar-display")
        if (node) {
            var newval = document.createElement("div")
            setExactDollarNode(newval, amount, id, timing)
            node.appendChild(newval)
            newval.scrollIntoView()
        }
    }
}

function setExactDollarNode(node, amount, id, timing) {
    //console.log("Dollar amount " + amount + " " + id + " " + timing)
    node.setAttribute("dolar-amount", amount) // save value
    node.setAttribute("id", "windowhash-" + id)
    var message = ""
    if (timing == "EARLY") {
        node.className = "incomplete"
        message = "(processing)"
    } else if (timing == "ON_TIME") {
        node.className = ""
    } else if (timing == "LATE") {
        node.className = "corrected"
        message = "(updated)"
    }
    node.innerText = message + " " + formatDollars(amount)
}

function queryIfDisplayed(id) {
    var e = document.querySelector(id)
    var visible = (e != null)
    var el = e
    while (el && el.tagName !== "BODY") {
        visible = visible && (getComputedStyle(el, null).display != 'none')
        el = el.parentNode
    }
    if (visible)
        return e
    else
        return null
}

function formatDollars(amount) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

setDataStatus(DATA_STATUS_ZERO)

function setStartStopButton(val) {
    var signedin = auth2.isSignedIn.get()
    if (val == "start" && signedin) {
        startFetchingRidesButton.disabled = false;
        startFetchingRidesButton.style.display = 'block';
        stopFetchingRidesButton.style.display = 'none';
    }
    if (val == "stop" && signedin) {
        stopFetchingRidesButton.disabled = false;
        startFetchingRidesButton.style.display = 'none';
        stopFetchingRidesButton.style.display = 'block';
    }
    if (val == "disabled") {
        startFetchingRidesButton.disabled = true;
        stopFetchingRidesButton.disabled = true;
    }
    if (val == "hidden") {
        startFetchingRidesButton.style.display = 'none';
        stopFetchingRidesButton.style.display = 'none';
    }
}

var app = angular.module('TaxiRidesVisualizer', []);
app.controller('ProjectTopicsController', function($scope, $timeout, projectsService, topicsService) {
    $scope.authorize = function() {
        auth2.signIn();
    };

    $scope.signout = function() {
        if (stopFetchingRidesButton.style.display == 'block') {
            $scope.stopFetching()
        };
        auth2.signOut();
        $scope.pubsub_status = "";
        setStartStopButton("hidden")
    };

    $scope.startFetching = function() {
        $scope.pubsub_status = "Creating PubSub subscription...";
        setStartStopButton("disabled")
        projectId = $scope.selectedProject.projectId
        topicId = $scope.selectedTopic.id
        createTopicPrFn = function(reason) {
            return pubsub.projects.subscriptions
                .create({
                    name: 'projects/' + projectId + '/subscriptions/' + PUBSUB_SUBSCRIPTION_NAME,
                    topic: topicId,
                    ackDeadlineSeconds: 120
                });
        };

        pubsub.projects.subscriptions
            .delete({ subscription: 'projects/' + projectId + '/subscriptions/' + PUBSUB_SUBSCRIPTION_NAME })
            .then(
                createTopicPrFn, createTopicPrFn
            ).then(
                function(response) {
                    if (auth2.isSignedIn.get()) {
                        PUBSUB_SUBSCRIPTION = response.result.name;
                        startPullingFromPubSub();
                        setStartStopButton("stop")
                            //$scope.pubsub_status = "Fetching rides...";
                        $scope.pubsub_status = "";
                        $scope.$apply();
                    }
                }
            );
    };

    $scope.stopFetching = function() {
        $scope.pubsub_status = "Deleting PubSub subscription...";
        setStartStopButton("disabled")
        stopPullingFromPubSub()
        clearStatusFn = function(resp) {
            $scope.pubsub_status = '';
            setStartStopButton("start")
            $scope.$apply();
        };
        pubsub.projects.subscriptions
            .delete({ subscription: 'projects/' + projectId + '/subscriptions/' + PUBSUB_SUBSCRIPTION_NAME })
            .then(clearStatusFn, clearStatusFn);
    };

    $scope.loadProjects = function() {
        $scope.pubsub_status = 'Checking authentication...';
        authPromise.then(function() {
            if (auth2.isSignedIn.get()) {
                $scope.pubsub_status = 'Loading projects...';
            } else {
                $scope.pubsub_status = '';
            }
            $scope.$apply();
        }).then(projectsService.getProjects).then(function(projects) {
            $scope.projects = projects;
            projectsSelect.style.display = 'block';
            $scope.pubsub_status = '';
            $scope.$apply();
        });
    };
    $scope.loadProjects();
    $scope.projectSelected = function() {
        $scope.loadTopics();
    };

    $scope.loadTopics = function(next) {
        //$scope.status_active = true;
        if ($scope.selectedProject != null) {
            $scope.pubsub_status = 'Loading topics...';
            topicsService.getTopics($scope.selectedProject.projectId).then(
                function(topics) {
                    $scope.topics = topics;
                    if (topics.length > 0) {
                        topicsSelect.style.display = 'block';
                        $scope.pubsub_status = '';
                    } else {
                        topicsSelect.style.display = 'none';
                        $scope.pubsub_status = 'No topics found in this project';
                    }
                }
            )
        }
    }

    $scope.topicSelected = function() {
        if ($scope.selectedTopic != null)
            setStartStopButton("start")
    };
});

app.factory('projectsService', function($q) {
    return {
        getProjects: function() {
            var deferred = $q.defer();
            projects = []
            authPromise.then(function() {
                if (auth2.isSignedIn.get()) {
                    function fetchProjects(nextPageToken) {
                        var request = crm.projects.list({ pageSize: 1000, pageToken: nextPageToken })
                        request.execute(function(resp) {
                            resp.projects.forEach(function(p) {
                                if (p.lifecycleState === "ACTIVE") {
                                    projects.push(p)
                                }
                            });
                            if (resp.nextPageToken) {
                                fetchProjects(resp.nextPageToken)
                            } else {
                                deferred.resolve(projects)
                            }
                        })
                    }
                    fetchProjects('')
                }
            })
            return deferred.promise;
        }
    }
});

app.factory('topicsService', function($q) {
    return {
        getTopics: function(projectId) {
            var deferred = $q.defer();
            authPromise.then(function() {
                if (auth2.isSignedIn.get()) {
                    var request = pubsub.projects.topics.list({ project: 'projects/' + projectId, pageSize: 1000 })
                    request.execute(function(resp) {
                        topics = []
                        if ('topics' in resp) {
                            resp.topics.forEach(function(element) {
                                topics.push({ name: element.name.substring(element.name.lastIndexOf("/") + 1), id: element.name })
                            });
                        }
                        deferred.resolve(topics)
                    })
                }
            })
            return deferred.promise;
        }
    }
});