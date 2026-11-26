---
title: zerolog — Zero Allocation JSON Logger
description: Fast, simple structured logging for Go, dedicated to JSON output. Leveled logging, sampling, hooks, contextual fields, and a chaining API that avoids allocations and reflection.
---

# zerolog

The zerolog package provides a fast and simple logger dedicated to JSON output.

Zerolog's API is designed to provide both a great developer experience and stunning performance. Its unique chaining API allows zerolog to write JSON (or CBOR) log events by avoiding allocations and reflection. Uber's [zap](https://godoc.org/go.uber.org/zap) library pioneered this approach. Zerolog takes this concept to the next level with a simpler to use API and even better performance.

To keep the code base and the API simple, zerolog focuses on efficient structured logging only. Pretty logging on the console is made possible using the provided (but inefficient) `zerolog.ConsoleWriter`.

## What you get

- **Blazing fast, low to zero allocation** — see [Performance](guides/performance).
- **Leveled logging** — trace, debug, info, warn, error, fatal, panic, plus a global level switch.
- **Log sampling** — `BasicSampler` and `BurstSampler` keep high-volume debug output under control.
- **Hooks** — run code on every event, for example to attach a severity or a trace ID.
- **Contextual fields** — strongly typed key/value pairs, sub-loggers, and `context.Context` integration.
- **Integration with `net/http`** — the `hlog` package carries a logger through request handlers.
- **JSON and CBOR encoding** — binary logs via the `binary_log` build tag.
- **Pretty logging for development** — `ConsoleWriter` turns JSON events into colorized console lines.
- **Error logging with optional stacktrace** — via `github.com/pkg/errors` and `pkgerrors.MarshalStack`.
- **`log/slog` integration** — a `slog.Handler` that routes standard-library records through zerolog.

## Where to start

- New to zerolog? Read [Quickstart](quickstart) — install, your first log line, and your first leveled event.
- Already logging? [Levels and sampling](guides/levels-sampling) and [Context and fields](guides/context-fields) cover the daily API.
- Shipping to production? [Writers and output](guides/writers-output) and [Performance](guides/performance) cover outputs, the diode writer, and the caveats that bite (field duplication, `Event` pooling, `UpdateContext` concurrency).

## API reference

The [Go API](api) tab is the full reference for the `github.com/rs/zerolog` package, generated from the package source: 26 types, 20 package-level functions, 215 methods, 16 constants, and 34 variables — including `Logger`, `Event`, `Context`, `ConsoleWriter`, `MultiLevelWriter`, and the samplers.

## Documented version

This site documents **rs/zerolog @ 284f7c8** (commit `284f7c889533b78603191349f4a5c48628d7afd2`, 10 Nov 2026), MIT licensed. Source links in the API reference point at that exact commit on GitHub.
