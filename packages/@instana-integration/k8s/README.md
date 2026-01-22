# @instana-integration/k8s

The Instana integration package used to support monitoring of Kubernetes componentes. Once you import this package into your Instana environment, you will be able to monitor Kubernetes entities like ReplicaSet, StatefulSet, DaemonSet etc.

## Dashboards

Below are the dashboards that are currently supported by this integration package.

| Dashboard Title                     | Description                              |
| ----------------------------------- | ---------------------------------------- |
| Cron Job Monitoring                 | Dashboard for Cron Job                   |
| DaemonSet Monitoring                | Dashboard for DaemonSet                  |
| Deployment Monitoring               | Dashboard for Deployment                 |
| HorizontalPod AutoScaler Monitoring | Dashboard for Horizontal Pod Auto Scaler |
| Job Monitoring                      | Dashboard for Job                        |
| ReplicaSet Monitoring               | Dashboard for ReplicaSet                 |
| ReplicationController Monitoring    | Dashboard for Replication Controller     |
| StatefulSet Monitoring              | Dashboard for StatefulSet                |

## Entities

Below are the entities that are currently supported by this integration package.

| Title                    |
| ------------------------ |
| Cron Job                 |
| DaemonSet                |
| Deployment               |
| HorizontalPod AutoScaler |
| Job                      |
| ReplicaSet               |
| ReplicationController    |
| StatefulSet              |

## Metrics

### Semantic Conventions

The k8s metrics are obtained by OpenTelemetry auto-instrumentation and scraped by the OpenTelemetry Collector for Kubernetes.

Below are the Kubernetes metrics that are currently supported by this integration package:

| Metric Name                             | Type  | Description                                                                                                                | Unit   | Dashboard(s)                 |
| --------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------- |
| `k8s.cronjob.active`                    | Gauge | The number of actively running jobs for a cronjob                                                                          | number | CronJob.json                 |
| `k8s.daemonset.current_scheduled_nodes` | Gauge | Number of nodes that are running at least 1 daemon pod and are supposed to run the daemon pod                              | number | DaemonSet.json               |
| `k8s.daemonset.desired_scheduled_nodes` | Gauge | Number of nodes that should be running the daemon pod (including nodes currently running the daemon pod)                   | number | DaemonSet.json               |
| `k8s.daemonset.misscheduled_nodes`      | Gauge | Number of nodes that are running the daemon pod, but are not supposed to run the daemon pod                                | number | DaemonSet.json               |
| `k8s.daemonset.ready_nodes`             | Gauge | Number of nodes that should be running the daemon pod and have one or more of the daemon pod running and ready             | number | DaemonSet.json               |
| `k8s.deployment.available`              | Gauge | Total number of available replica pods (ready for at least minReadySeconds) targeted by this deployment                    | number | Deployment.json              |
| `k8s.deployment.desired`                | Gauge | Number of desired replica pods in this deployment                                                                          | number | Deployment.json              |
| `k8s.hpa.current`                       | Gauge | Current number of replica pods managed by this horizontal pod autoscaler                                                   | number | HorizontalPodAutoscaler.json |
| `k8s.hpa.desired`                       | Gauge | Desired number of replica pods managed by this horizontal pod autoscaler                                                   | number | HorizontalPodAutoscaler.json |
| `k8s.hpa.max`                           | Gauge | The upper limit for the number of replica pods to which the autoscaler can scale up                                        | number | HorizontalPodAutoscaler.json |
| `k8s.hpa.min`                           | Gauge | The lower limit for the number of replica pods to which the autoscaler can scale down                                      | number | HorizontalPodAutoscaler.json |
| `k8s.job.active`                        | Gauge | The number of pending and actively running pods for a job                                                                  | number | Job.json                     |
| `k8s.job.desired_successful`            | Gauge | The desired number of successfully finished pods the job should be run with                                                | number | Job.json                     |
| `k8s.job.failed`                        | Gauge | The number of pods which reached phase Failed for a job                                                                    | number | Job.json                     |
| `k8s.job.max_parallel`                  | Gauge | The max desired number of pods the job should run at any given time                                                        | number | Job.json                     |
| `k8s.job.successful`                    | Gauge | The number of pods which reached phase Succeeded for a job                                                                 | number | Job.json                     |
| `k8s.replicaset.available`              | Gauge | Total number of available replica pods (ready for at least minReadySeconds) targeted by this replicaset                    | number | ReplicaSet.json              |
| `k8s.replicaset.desired`                | Gauge | Number of desired replica pods in this replicaset                                                                          | number | ReplicaSet.json              |
| `k8s.replicationcontroller.available`   | Gauge | Total number of available replica pods (ready for at least minReadySeconds) targeted by this replication controller        | number | ReplicationController.json   |
| `k8s.replicationcontroller.desired`     | Gauge | Number of desired replica pods in this replication controller                                                              | number | ReplicationController.json   |
| `k8s.statefulset.current`               | Gauge | The number of replica pods created by the statefulset controller from the statefulset version indicated by currentRevision | number | StatefulSet.json             |
| `k8s.statefulset.desired`               | Gauge | Number of desired replica pods in this statefulset                                                                         | number | StatefulSet.json             |
| `k8s.statefulset.ready`                 | Gauge | The number of replica pods created for this statefulset with a Ready Condition                                             | number | StatefulSet.json             |
| `k8s.statefulset.updated`               | Gauge | Number of replica pods created by the statefulset controller from the statefulset version indicated by updateRevision      | number | StatefulSet.json             |

### Resource Attributes

Below are the resource attributes that are currently supported by this integration package.

| Attribute Key       | Type   | Description                                                             |
| ------------------- | ------ | ----------------------------------------------------------------------- |
| service.name        | string | This attribute is used to describe the entity name.                     |
| service.instance.id | string | This attribute is used to describe the entity ID of the current object. |

              |

## Installation and Usage

With [Instana CLI for integration package management](https://github.com/instana/observability-as-code?tab=readme-ov-file#instana-cli-for-integration-package-management), you can manage the lifecycle of this package such as downloading the package and importing it into Instana.

Downloading the package:

```shell
$ stanctl-integration download --package @instana-integration/k8s
```

Importing the package into Instana:

```shell
$ stanctl-integration import --package @instana-integration/k8s \
  --server $INSTANA_SERVER \
  --token $API_TOKEN \
  --set servicename=$SERVICE_NAME \
  --set serviceinstanceid=$SERVICE_INSTANCE_ID
```

- INSTANA_SERVER: This is the base URL of an Instana tenant unit, e.g. https://test-example.instana.io, which is used by the CLI to communicate with Instana server for package lifecycle management.
- API_TOKEN: Requests against the Instana API require valid API tokens. The API token can be generated via the Instana user interface. For more information, please refers to [Instana documentation](https://www.ibm.com/docs/en/instana-observability/current?topic=apis-instana-rest-api#usage-of-api-token).
- SERVICE_NAME: Logical name of the service.
- SERVICE_INSTANCE_ID: The string ID of the service instance. The ID helps to distinguish instances of the same service that exist at the same time (e.g. instances of a horizontally scaled service).
