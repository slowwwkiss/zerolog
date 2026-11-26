---
title: Integrations
description: Use zerolog with net/http via hlog, with the standard library log/slog, and as the standard logger's output.
---

# Integrations

## Integration with `net/http`

The `github.com/rs/zerolog/hlog` package provides some helpers to integrate zerolog with `http.Handler`. In this example we use [alice](https://github.com/justinas/alice) to install the logger for better readability:

```go
log := zerolog.New(os.Stdout).With().
    Timestamp().
    Str("role", "my-service").
    Str("host", host).
    Logger()

c := alice.New()

// Install the logger handler with default output on the console
c = c.Append(hlog.NewHandler(log))

// Install some provided extra handler to set some request's context fields.
// Thanks to that handler, all our logs will come with some prepopulated fields.
c = c.Append(hlog.AccessHandler(func(r *http.Request, status, size int, duration time.Duration) {
    hlog.FromRequest(r).Info().
        Str("method", r.Method).
        Stringer("url", r.URL).
        Int("status", status).
        Int("size", size).
        Dur("duration", duration).
        Msg("")
}))
c = c.Append(hlog.RemoteAddrHandler("ip"))
c = c.Append(hlog.UserAgentHandler("user_agent"))
c = c.Append(hlog.RefererHandler("referer"))
c = c.Append(hlog.RequestIDHandler("req_id", "Request-Id"))

// Here is your final handler
h := c.Then(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    // Get the logger from the request's context. You can safely assume it
    // will be always there: if the handler is removed, hlog.FromRequest
    // will return a no-op logger.
    hlog.FromRequest(r).Info().
        Str("user", "current user").
        Str("status", "ok").
        Msg("Something happened")

    // Output: {"level":"info","time":"2001-02-03T04:05:06Z","role":"my-service","host":"local-hostname","req_id":"b4g0l5t6tfid6dtrapu0","user":"current user","status":"ok","message":"Something happened"}
}))
http.Handle("/", h)

if err := http.ListenAndServe(":8080", nil); err != nil {
    log.Fatal().Err(err).Msg("Startup failed")
}
```

## Integration with `log/slog`

Zerolog provides a `slog.Handler` implementation that routes `log/slog` records through a zerolog logger. This lets you use the standard library's `slog` API while keeping zerolog's performance and encoding:

```go
package main

import (
    "log/slog"

    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    zl := log.Logger
    handler := zerolog.NewSlogHandler(zl)
    logger := slog.New(handler)

    logger.Info("user logged in", "user", "alice", "role", "admin")
}

// Output: {"level":"info","user":"alice","role":"admin","time":"...","message":"user logged in"}
```

The handler supports all `slog` features including `WithAttrs`, `WithGroup`, nested groups, and `LogValuer` resolution. slog levels are mapped to zerolog levels (e.g. `slog.LevelDebug` to `zerolog.DebugLevel`).

## Set as standard logger output

```go
log := zerolog.New(os.Stdout).With().
    Str("foo", "bar").
    Logger()

stdlog.SetFlags(0)
stdlog.SetOutput(log)

stdlog.Print("hello world")

// Output: {"foo":"bar","message":"hello world"}
```

## Related projects

- [grpc-zerolog](https://github.com/cheapRoc/grpc-zerolog): implementation of `grpclog.LoggerV2` interface using zerolog.
- [overlog](https://github.com/Trendyol/overlog): implementation of `Mapped Diagnostic Context` interface using zerolog.
- [zerologr](https://github.com/go-logr/zerologr): implementation of `logr.LogSink` interface using zerolog.
- [logze](https://github.com/maxbolgarin/logze): implementation of `log/slog` interface using zerolog.
