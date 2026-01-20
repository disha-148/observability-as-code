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

| Title                    | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| Cron Job                 | Custom entities and dashboard for Cron Job                   |
| DaemonSet                | Custom entities and dashboard for DaemonSet                  |
| Deployment               | Custom entities and dashboard for Deployment                 |
| HorizontalPod AutoScaler | Custom entities and dashboard for Horizontal Pod Auto Scaler |
| Job                      | Custom entities and dashboard for Job                        |
| ReplicaSet               | Custom entities and dashboard for ReplicaSet                 |
| ReplicationController    | Custom entities and dashboard for Replication Controller     |
| StatefulSet              | Custom entities and dashboard for StatefulSet                |

## Metrics

### Semantic Conventions

The k8s metrics are obtained by OpenTelemetry auto-instrumentation:

Below are the k8s metrics that are scrapped by the Otel collector for kubernetes

CronJob

| Metrics Name           | Description                                       | Unit   |
| ---------------------- | ------------------------------------------------- | ------ |
| k8s.cronjob.job.active | The number of actively running jobs for a cronjob | Number |

DaemonSet

| Metrics Name                         | Description                                                                                                    | Unit   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------ |
| k8s.daemonset.node.current_scheduled | Number of nodes that are running at least 1 daemon pod and are supposed to run the daemon pod                  | Number |
| k8s.daemonset.node.desired_scheduled | Number of nodes that should be running the daemon pod (including nodes currently running the daemon Pod)       | Number |
| k8s.daemonset.node.misscheduled      | Number of nodes that are running the daemon pod, but are not supposed to run the daemon pod                    | Number |
| k8s.daemonset.node.ready             | Number of nodes that should be running the daemon pod and have one or more of the daemon pod running and ready | Number |

Deployment
| Metrics Name | Description | Unit |
| --------------------------------------- | --------------- | ---------- |
| k8s.deployment.pod.desired | Number of desired replica pods in this deployment. [ | Number |
| k8s.deployment.pod.available | Total number of available replica pods (ready for at least minReadySeconds) targeted by this deployment | Number |

HorizontalPod AutoScaler
| Metrics Name | Description | Unit |
| --------------------------------------- | --------------- | ---------- |
| k8s.hpa.desired | Desired number of replica pods managed by this horizontal pod autoscaler | Number |
| k8s.hpa.current| Current number of replica pods managed by this horizontal pod autoscaler | Number |
| k8s.hpa.max| The upper limit for the number of replica pods to which the autoscaler can scale up | Number |
| k8s.hpa.min| The lower limit for the number of replica pods to which the autoscaler can scale down | Number |

Job
| Metrics Name | Description | Unit |
| --------------------------------------- | --------------- | ---------- |
| k8s.job.job.active | The number of pending and actively running pods for a job | Number |
| k8s.job.pod.failed | The number of pods which reached phase Failed for a job | Number |
| k8s.job.pod.successful | The number of pods which reached phase Succeeded for a job. | Number |
| k8s.job.pod.desired_successful | The desired number of successfully finished pods the job should be run with. | Number |
| k8s.job.pod.max_parallel | The max desired number of pods the job should run at any given time. | Number |

ReplicaSet
| Metrics Name | Description | Unit |
| --------------------------------------- | --------------- | ---------- |
| k8s.replicaset.pod.desired| Number of desired replica pods in this replicaset | Number |
| k8s.replicaset.pod.available | Total number of available replica pods (ready for at least minReadySeconds) targeted by this replicaset | Number |

ReplicationController
| Metrics Name | Description | Unit |
| --------------------------------------- | --------------- | ---------- |
| k8s.replicationcontroller.pod.desired | Number of desired replica pods in this replication controller. | Number |  
| k8s.replicationcontroller.pod.available"| Total number of available replica pods (ready for at least minReadySeconds) targeted by this replication controller | Number |

StatefulSet
| Metrics Name | Category | Unit |
| --------------------------------------- | --------------- | ---------- |
| k8s.statefulset.pod.desired | Number of desired replica pods in this statefulset | Number |
| k8s.statefulset.pod.ready | The number of replica pods created for this statefulset with a Ready Condition. | Number |
| k8s.statefulset.pod.current | The number of replica pods created by the statefulset controller from the statefulset version indicated by currentRevision. | Number |
| k8s.statefulset.pod.updated| Number of replica pods created by the statefulset controller from the statefulset version indicated by updateRevision | Number |

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
