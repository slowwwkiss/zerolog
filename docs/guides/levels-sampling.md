---
title: Levels and sampling
description: The seven log levels, the global level switch, logging without a level, and sampling with BasicSampler and BurstSampler.
---

# Levels and sampling

## The levels

Zerolog allows for logging at the following levels (from highest to lowest):

- panic (`zerolog.PanicLevel`, 5)
- fatal (`zerolog.FatalLevel`, 4)
- error (`zerolog.ErrorLevel`, 3)
- warn (`zerolog.WarnLevel`, 2)
- info (`zerolog.InfoLevel`, 1)
- debug (`zerolog.DebugLevel`, 0)
- trace (`zerolog.TraceLevel`, -1)

## Setting the global level

You can set the global logging level to any of these options using the `SetGlobalLevel` function in the zerolog package, passing in one of the given constants above, e.g. `zerolog.InfoLevel` would be the "info" level. Whichever level is chosen, all logs with a level greater than or equal to that level will be written. To turn off logging entirely, pass the `zerolog.Disabled` constant.

If you never call `SetGlobalLevel`, the global logger writes to `os.Stderr` at the `trace` level (the lowest level), so **every** event — `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `panic` — is written to stderr by default. Calling `zerolog.SetGlobalLevel(zerolog.InfoLevel)` raises the minimum level so `trace` and `debug` messages are suppressed.

This example uses command-line flags to demonstrate various outputs depending on the chosen log level:

```go
package main

import (
    "flag"

    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
    debug := flag.Bool("debug", false, "sets log level to debug")

    flag.Parse()

    // Default level for this example is info, unless debug flag is present
    zerolog.SetGlobalLevel(zerolog.InfoLevel)
    if *debug {
        zerolog.SetGlobalLevel(zerolog.DebugLevel)
    }

    log.Debug().Msg("This message appears only when log level set to Debug")
    log.Info().Msg("This message appears when log level set to Debug or Info")

    if e := log.Debug(); e.Enabled() {
        // Compute log output only if enabled.
        value := "bar"
        e.Str("foo", value).Msg("some debug message")
    }
}
```

Info output (no flag):

```bash
$ ./logLevelExample
{"time":1516387492,"level":"info","message":"This message appears when log level set to Debug or Info"}
```

Debug output (debug flag set):

```bash
$ ./logLevelExample -debug
{"time":1516387573,"level":"debug","message":"This message appears only when log level set to Debug"}
{"time":1516387573,"level":"info","message":"This message appears when log level set to Debug or Info"}
{"time":1516387573,"level":"debug","foo":"bar","message":"some debug message"}
```

## Logging without a level or message

You may choose to log without a specific level by using the `Log` method. You may also write without a message by setting an empty string in the `msg string` parameter of the `Msg` method:

```go
package main

import (
    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

    log.Log().
        Str("foo", "bar").
        Msg("")
}

// Output: {"time":1494567715,"foo":"bar"}
```

## Error and fatal logging

You can log errors using the `Err` method:

```go
package main

import (
    "errors"

    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

    err := errors.New("seems we have an error here")
    log.Error().Err(err).Msg("")
}

// Output: {"level":"error","error":"seems we have an error here","time":1609085256}
```

The default field name for errors is `error`; you can change this by setting `zerolog.ErrorFieldName` to meet your needs.

A fatal event exits the process with status 1 after writing:

```go
package main

import (
    "errors"

    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    err := errors.New("A repo man spends his life getting into tense situations")
    service := "myservice"

    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

    log.Fatal().
        Err(err).
        Str("service", service).
        Msgf("Cannot start %s", service)
}

// Output: {"time":1516133263,"level":"fatal","error":"A repo man spends his life getting into tense situations","service":"myservice","message":"Cannot start myservice"}
//         exit status 1
```

Note: using `Msgf` generates one allocation even when the logger is disabled.

### Error logging with a stacktrace

Using `github.com/pkg/errors`, you can add a formatted stacktrace to your errors:

```go
package main

import (
    "github.com/pkg/errors"
    "github.com/rs/zerolog/pkgerrors"

    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
    zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack

    err := outer()
    log.Error().Stack().Err(err).Msg("")
}
```

`zerolog.ErrorStackMarshaler` must be set in order for the stack to output anything. See `pkgerrors.MarshalStack` in the [Go API](api) reference.

## Log sampling

```go
sampled := log.Sample(&zerolog.BasicSampler{N: 10})
sampled.Info().Msg("will be logged every 10 messages")

// Output: {"time":1494567715,"level":"info","message":"will be logged every 10 messages"}
```

More advanced sampling:

```go
// Will let 5 debug messages per period of 1 second.
// Over 5 debug message, 1 every 100 debug messages are logged.
// Other levels are not sampled.
sampled := log.Sample(zerolog.LevelSampler{
    DebugSampler: &zerolog.BurstSampler{
        Burst: 5,
        Period: 1*time.Second,
        NextSampler: &zerolog.BasicSampler{N: 100},
    },
})
sampled.Debug().Msg("hello world")

// Output: {"time":1494567715,"level":"debug","message":"hello world"}
```

Sampling is controlled per logger by `Logger.Sample`, and globally by `zerolog.DisableSampling` — if set to `true`, all sampled loggers stop sampling and issue 100% of their log events.
