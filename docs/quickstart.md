---
title: Quickstart
description: Install zerolog, write your first log line, and log your first leveled event with contextual fields.
---

# Quickstart

## Install

```bash
go get -u github.com/rs/zerolog/log
```

## Your first log line

For simple logging, import the global logger package `github.com/rs/zerolog/log`:

```go
package main

import (
    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    // UNIX Time is faster and smaller than most timestamps
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

    log.Print("hello world")
}

// Output: {"time":1516134303,"level":"debug","message":"hello world"}
```

By default `log` writes to `os.Stderr`. The default log level for `log.Print` is *trace*.

## Your first leveled event

```go
package main

import (
    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

    log.Info().Msg("hello world")
}

// Output: {"time":1516134303,"level":"info","message":"hello world"}
```

It is very important to note that when using the chaining API, as shown above (`log.Info().Msg("hello world")`), the chain must have either the `Msg` or `Msgf` method call. If you forget to add either of these, the log will not occur and there is no compile time error to alert you of this.

## Add contextual fields

Zerolog allows data to be added to log messages in the form of key:value pairs. The data added to the message adds "context" about the log event that can be critical for debugging as well as myriad other purposes:

```go
package main

import (
    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

    log.Debug().
        Str("Scale", "833 cents").
        Float64("Interval", 833.09).
        Msg("Fibonacci is everywhere")

    log.Debug().
        Str("Name", "Tom").
        Send()
}

// Output: {"level":"debug","Scale":"833 cents","Interval":833.09,"time":1562212768,"message":"Fibonacci is everywhere"}
// Output: {"level":"debug","Name":"Tom","time":1562212768}
```

Note in the above example that when adding contextual fields, the fields are strongly typed. The full list of supported field types is in the [Go API](api) reference under `Event` — `Str`, `Bool`, `Int`, `Int64`, `Float64`, `Dur`, `Dict`, `Err`, `Time`, and more, most of them also in slice form (`Strs`, `Errs`, and so on).

## Create your own logger

```go
logger := zerolog.New(os.Stderr).With().Timestamp().Logger()

logger.Info().Str("foo", "bar").Msg("hello world")

// Output: {"level":"info","time":1494567715,"message":"hello world","foo":"bar"}
```

Sub-loggers let you chain loggers with additional context:

```go
sublogger := log.With().
                 Str("component", "foo").
                 Logger()
sublogger.Info().Msg("hello world")

// Output: {"level":"info","time":1494567715,"message":"hello world","component":"foo"}
```

## Next steps

- [Levels and sampling](guides/levels-sampling) — the seven levels, the global level switch, and sampling.
- [Context and fields](guides/context-fields) — sub-loggers, `Dict`, hooks, caller info, and field names.
- [Writers and output](guides/writers-output) — console output, multiple outputs, and the non-blocking diode writer.
