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

var auth2 // The Sign-In object.

// Google Maps API initialisation
function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: { lat: 40.75144, lng: -74.00331 },
        mapTypeId: google.maps.MapTypeId.SATELLITE
    })
    var fakedata = []
    fakedata.push(new google.maps.LatLng(0, 0))
    heatmap = new google.maps.visualization.HeatmapLayer({
            data: fakedata,
            map: map
        })
        //TODO: autodetect if points are spaced evenly and adjust radius automatically
        //heatmap.set('radius', 35);
}

// Google Auth2, PubSub, CRM API initialisation
function handleClientLoad() {
    authPromise =
        loadAuth2()
        .then(initAuth2)
        .then(checkSignIn)
        .then(loadPubSub)
        .then(initPubSub, logError)
        .then(loadCloudResourceManager)
        .then(initCloudResourceManager, logError)
}

function loadAuth2() {
    return new Promise(function(resolve, reject) {
        gapi.load('client:auth2', resolve)
    })
}

function initAuth2() {
    return gapi.auth2.init({
            client_id: '19808069448-df7e5a57c3ftmfk3e9tptk6s7942qpah.apps.googleusercontent.com',
            scope: 'profile https://www.googleapis.com/auth/pubsub https://www.googleapis.com/auth/cloudplatformprojects.readonly'
        }).then() // The API does not return a Promise but an object that returns a Promise from its .then() function
}

function checkSignIn() {
    auth2 = gapi.auth2.getAuthInstance();
    // Listen for sign-in state changes.
    auth2.isSignedIn.listen(updateSigninStatus);
    // Handle the initial sign-in state.
    updateSigninStatus(auth2.isSignedIn.get());
}

function loadPubSub() {
    return gapi.client.load('pubsub', 'v1')
}

function initPubSub() {
    pubsub = gapi.client.pubsub
}

function loadCloudResourceManager() {
    return gapi.client.load('cloudresourcemanager', 'v1')
}

function initCloudResourceManager() {
    crm = gapi.client.cloudresourcemanager
}

function logError(err) {
    console.log(err)
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        angular.element(projectsSelect).scope().loadProjects();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        projectsSelect.style.display = 'none';
        topicsSelect.style.display = 'none';
        startFetchingRidesButton.style.display = 'none';
        stopFetchingRidesButton.style.display = 'none';
    }
}