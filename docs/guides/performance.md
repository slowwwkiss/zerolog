---
title: Performance
description: Why zerolog is fast, the benchmark numbers, and the caveats to respect — field duplication, Event pooling, and UpdateContext concurrency.
---

# Performance

## Why it is fast

Zerolog's chaining API writes JSON (or CBOR) log events by avoiding allocations and reflection. That is the whole design: a level method returns an `Event`, field methods append directly to the event's buffer, and `Msg`/`Send` writes the buffer once. Disabled levels short-circuit before any field work happens — guard expensive field computation with `e.Enabled()` when it matters.

See [logbench](http://bench.zerolog.io/) for more comprehensive and up-to-date benchmarks.

All operations are allocation free (those numbers *include* JSON encoding):

```text
BenchmarkLogEmpty-8        100000000    19.1 ns/op     0 B/op       0 allocs/op
BenchmarkDisabled-8        500000000    4.07 ns/op     0 B/op       0 allocs/op
BenchmarkInfo-8            30000000     42.5 ns/op     0 B/op       0 allocs/op
BenchmarkContextFields-8   30000000     44.9 ns/op     0 B/op       0 allocs/op
BenchmarkLogFields-8       10000000     184 ns/op      0 B/op       0 allocs/op
```

Using Uber's zap comparison benchmark:

Log a message and 10 fields:

| Library             |    Time     | Bytes Allocated | Objects Allocated |
| :------------------ | :---------: | :-------------: | :---------------: |
| zerolog             |  767 ns/op  |    552 B/op     |    6 allocs/op    |
| zap                 |  848 ns/op  |    704 B/op     |    2 allocs/op    |
| zap (sugared)       | 1363 ns/op  |    1610 B/op    |   20 allocs/op    |
| go-kit              | 3614 ns/op  |    2895 B/op    |   66 allocs/op    |
| lion                | 5392 ns/op  |    5807 B/op    |   63 allocs/op    |
| logrus              | 5661 ns/op  |    6092 B/op    |   78 allocs/op    |
| apex/log            | 15332 ns/op |    3832 B/op    |   65 allocs/op    |
| log15               | 20657 ns/op |    5632 B/op    |   93 allocs/op    |

Log a message with a logger that already has 10 fields of context:

| Library             |    Time     | Bytes Allocated | Objects Allocated |
| :------------------ | :---------: | :-------------: | :---------------: |
| zerolog             |  52 ns/op   |     0 B/op      |    0 allocs/op    |
| zap                 |  283 ns/op  |     0 B/op      |    0 allocs/op    |
| zap (sugared)       |  337 ns/op  |     80 B/op     |    2 allocs/op    |
| lion                | 2702 ns/op  |    4074 B/op    |   38 allocs/op    |
| go-kit              | 3378 ns/op  |    3046 B/op    |   52 allocs/op    |
| log15               | 14179 ns/op |    2642 B/op    |   44 allocs/op    |

Log a static string, without any context or `printf`-style templating:

| Library             |    Time    | Bytes Allocated | Objects Allocated |
| :------------------ | :--------: | :-------------: | :---------------: |
| zerolog             |  50 ns/op  |     0 B/op      |    0 allocs/op    |
| zap                 | 236 ns/op  |     0 B/op      |    0 allocs/op    |
| standard library    | 453 ns/op  |     80 B/op     |    2 allocs/op    |
| zap (sugared)       |  337 ns/op |     80 B/op     |    2 allocs/op    |
| go-kit              |  508 ns/op |     656 B/op    |   13 allocs/op    |
| lion                |  771 ns/op |    1224 B/op    |   10 allocs/op    |
| logrus              | 1244 ns/op |    1505 B/op    |   27 allocs/op    |
| apex/log            | 2751 ns/op |    3832 B/op    |   11 allocs/op    |
| log15               | 5181 ns/op |    1592 B/op    |   26 allocs/op    |

There are a few Go logging benchmarks and comparisons that include zerolog: [imkira/go-loggers-bench](https://github.com/imkira/go-loggers-bench) and [uber-go/zap](https://github.com/uber-go/zap#performance).

## Caveats

### Field duplication

Note that zerolog does no de-duplication of fields. Using the same key multiple times creates multiple keys in final JSON:

```go
logger := zerolog.New(os.Stderr).With().Timestamp().Logger()
logger.Info().
       Timestamp().
       Msg("dup")
// Output: {"level":"info","time":1494567715,"time":1494567715,"message":"dup"}
```

In this case, many consumers will take the last value, but this is not guaranteed; check yours if in doubt.

### Concurrency safety

Be careful when calling `UpdateContext`. It is not concurrency safe. Use the `With()` method to create a child logger:

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // Create a child logger for concurrency safety
    logger := log.Logger.With().Logger()

    // Add context fields, for example User-Agent from HTTP headers
    logger.UpdateContext(func(c zerolog.Context) zerolog.Context {
        ...
    })
}
```

### Do not hold `Event`, `Array`, or `Dict` references

The `Event` object returned from the `Logger` level-specific message functions (e.g. `Log()`, `Trace()`, `Debug()`, etc.) is allocated in `sync.Pool` memory that will be returned to the pool as soon as the `Msg()`, `Msgf()`, `Send()`, or `MsgFunc()` writes the message and **must not** be accessed afterwards.

**Do not** hold a reference to the `*Event` while in callback functions or your own code. This is especially important in `Hook.Run()` and `HookFunc` functions or `MarshalZerologObject(e *Event)` callback (e.g. `LogObjectMarshaler` implementations).

Any `Array` objects returned from `Context.CreateArray()` or `Event.CreateArray()` are from a `sync.Pool` so **do not** hold references to them from within any `MarshalZerologArray(a *Array)` callback (e.g. `LogArrayMarshaler` implementations) or your own code as they will be cleared and returned to the pool after being buffered by a call to `Context.Array()` or `Event.Array()`.

Any *dictionary* `Event` returned from `Context.CreateDict()` or `Event.CreateDict()` **must not** be referenced after being buffered by a call to `Array.Dict()`, `Context.Dict()`, or `Event.Dict()` as they will be cleared and returned to the pool.
