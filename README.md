# NYC Taxi Tycoon - Dataflow Codelab

This is the support code and solutions for the [NYC Taxi Tycoon Dataflow Codelab](https://gcplab.me/codelabs/cloud-dataflow-nyc-taxi-tycoon) 

## TL;DR
In this codelab you learn how to process streaming data with Dataflow. The public emulated data stream is based on 
the [NYC Taxi & Limousine Commission’s open dataset](https://data.cityofnewyork.us/) expanded with additional routing 
information using the [Google Maps Direction API](https://developers.google.com/maps/documentation/directions/) and 
interpolated timestamps to simulate a real time scenario.

## Public Pubsub Data Stream
The public [Google Cloud Pubsub](https://cloud.google.com/pubsub/) topic used in the codelab is available at: 
`projects/pubsub-public-data/topics/taxirides-realtime`

To test the public data stream you can create a subscription by using the [gcloud cli](https://cloud.google.com/sdk/gcloud/). 
Make sure you have selected a project with billing and the [PubSub API](https://console.cloud.google.com/apis/api/pubsub.googleapis.com/overview) enabled.

```gcloud alpha pubsub subscriptions create taxi-test-sub --topic projects/pubsub-public-data/topics/taxirides-realtime```

Wait for a couple seconds before pulling a message from your subscription

```gcloud alpha pubsub subscriptions pull projects/<your-project-id>/subscriptions/taxi-test-sub```

Finally, delete the test subscription using

```gcloud alpha pubsub subscriptions delete projects/<your-project-id>/subscriptions/taxi-test-sub```

## Contents of this repository

In the [dataflow](dataflow/) folder you find the solutions for all dataflow pipelines covered in the [NYC Taxi Tycoon Dataflow Codelab](https://gcplab.me/codelabs/cloud-dataflow-nyc-taxi-tycoon) 

The [visualizer](https://github.com/googlecodelabs/cloud-dataflow-nyc-taxi-tycoon/tree/gh-pages) code to display the output of your 
codelab dataflow pipelines can be found in the `gh-pages` branch. The visualizer is available hosted [here](https://googlecodelabs.github.io/cloud-dataflow-nyc-taxi-tycoon).

*Use: The NYC Taxi & Limousine Commission’s dataset is publicly available for anyone to use under the following terms 
provided by the Dataset Source —https://data.cityofnewyork.us/— and is provided "AS IS" without any warranty, express 
or implied, from Google. 
Google disclaims all liability for any damages, direct or indirect, resulting from the use of the dataset.*

*This is not an official Google product*
