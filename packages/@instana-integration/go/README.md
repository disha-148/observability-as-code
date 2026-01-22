# @instana-integration/go

The Instana integration package used to support Go monitoring. Once you import this package into your Instana environment, you will be able to monitor Go runtime and the applications on various aspects by checking the dashboards, alerts, etc. included in this integration package.

## Dashboards

Below are the dashboards that are currently supported by this integration package.

| Dashboard Title       | Description                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Go Runtime Metrics    | Instana custom dashboard that displays runtime metrics for Go application                                |
| Go Runtime Monitoring | Instana custom dashboard that displays runtime metrics for Go entity defined in this Integration package |

## Entities

Below are the entities that are currently supported by this integration package.

| Title      |
| ---------- |
| Go Runtime |

## Metrics

### Semantic Conventions

The Go runtime metrics are obtained by OpenTelemetry auto-instrumentation:

```
import "go.opentelemetry.io/contrib/instrumentation/runtime"
err := runtime.Start(runtime.WithMinimumReadMemStatsInterval(time.Second))
if err != nil {
    log.Fatal(err)
}
```

Below are the Go runtime metrics that are currently supported by this integration package.

| Metrics Name                           | Description         | Unit   | Dashboard             |
| -------------------------------------- | ------------------- | ------ | --------------------- |
| go.memory.used{go.memory.type="other"} | Memory Used - Other | Byte   | Go Runtime Monitoring |
| go.memory.used{go.memory.type="stack"} | Memory Used - Stack | Byte   | Go Runtime Monitoring |
| go.memory.allocated                    | Memory Allocated    | Byte   | Go Runtime Monitoring |
| go.memory.limit                        | Memory Limit        | Byte   | Go Runtime Monitoring |
| go.memory.gc.goal                      | GC Goal             | Byte   | Go Runtime Monitoring |
| go.memory.allocations                  | Memory Allocations  | Number | Go Runtime Monitoring |
| go.goroutine.count                     | Goroutine Count     | Number | Go Runtime Monitoring |
| go.processor.limit                     | Processor Limit     | Number | Go Runtime Monitoring |
| go.config.gogc                         | GOGC Config         | Number | Go Runtime Monitoring |
| process.runtime.go.mem.heap_inuse      | Heap Used           | Byte   | Go Runtime Metrics    |
| process.runtime.go.mem.heap_alloc      | Allocated Memory    | Byte   | Go Runtime Metrics    |
| process.runtime.go.mem.heap_sys        | System Heap         | Byte   | Go Runtime Metrics    |
| process.runtime.go.mem.heap_objects    | Heap Objects        | Number | Go Runtime Metrics    |
| process.runtime.go.goroutines          | Executed Goroutines | Number | Go Runtime Metrics    |

### Resource Attributes

Below are the resource attributes that are currently supported by this integration package.

| Attribute Key       | Type   | Description                                                             |
| ------------------- | ------ | ----------------------------------------------------------------------- |
| service.name        | string | This attribute is used to describe the entity name.                     |
| service.instance.id | string | This attribute is used to describe the entity ID of the current object. |

## Events

Below are the events that are currently supported by this integration package.

Note: In each event definition, conditionValue represents a threshold used to trigger the event and is provided as a default or reference value. Please adjust this value based on your specific environment.

| Event Name                             | Description                                                                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context Deadline Exceeded Errors       | Detects when Go applications are experiencing a high rate of context deadline exceeded errors, which may indicate timeouts in API calls, database operations, or other time-sensitive operations. |
| Go Heap Allocation Spike               | Detects sudden spikes in heap allocations in Go applications, which may indicate inefficient memory usage patterns or unexpected workload increases.                                              |
| High CPU Utilization in Go Application | Detects when a Go application is consuming an unusually high amount of CPU resources, which may indicate inefficient code, infinite loops, or excessive processing.                               |
| High Goroutine Count                   | Detects when a Go application has an unusually high number of goroutines, which may indicate goroutine leaks or excessive concurrency.                                                            |
| High Go Heap Usage                     | Detects when a Go application's heap usage is high relative to the system heap, which may indicate memory issues or leaks.                                                                        |
| HTTP Connection Pool Exhaustion        | Detects when a Go application's HTTP connection pool is nearing exhaustion, which may lead to connection timeouts and degraded performance for outgoing HTTP requests.                            |
| Go Memory Leak Detection               | Detects potential memory leaks in Go applications by monitoring continuously increasing heap object count over time.                                                                              |

## Installation and Usage

With [Instana CLI for integration package management](https://github.com/instana/observability-as-code?tab=readme-ov-file#instana-cli-for-integration-package-management), you can manage the lifecycle of this package such as downloading the package and importing it into Instana.

Downloading the package:

```shell
$ stanctl-integration download --package @instana-integration/go
```

Importing the package into Instana:

```shell
$ stanctl-integration import --package @instana-integration/go \
  --server $INSTANA_SERVER \
  --token $API_TOKEN \
  --set servicename=$SERVICE_NAME \
  --set serviceinstanceid=$SERVICE_INSTANCE_ID
```

- INSTANA_SERVER: This is the base URL of an Instana tenant unit, e.g. https://test-example.instana.io, which is used by the CLI to communicate with Instana server for package lifecycle management.
- API_TOKEN: Requests against the Instana API require valid API tokens. The API token can be generated via the Instana user interface. For more information, please refers to [Instana documentation](https://www.ibm.com/docs/en/instana-observability/current?topic=apis-instana-rest-api#usage-of-api-token).
- SERVICE_NAME: Logical name of the service.
- SERVICE_INSTANCE_ID: The string ID of the service instance. The ID helps to distinguish instances of the same service that exist at the same time (e.g. instances of a horizontally scaled service).
