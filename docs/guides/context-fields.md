---
title: Context and fields
description: Sub-loggers, contextual fields, sub-dictionaries, hooks, caller info, custom field names, and context.Context integration.
---

# Context and fields

## Field types

### Standard types

- `Str`
- `Bool`
- `Int`, `Int8`, `Int16`, `Int32`, `Int64`
- `Uint`, `Uint8`, `Uint16`, `Uint32`, `Uint64`
- `Float32`, `Float64`

### Advanced fields

- `Err`: takes an `error` and renders it as a string using the `zerolog.ErrorFieldName` field name.
- `Func`: run a `func` only if the level is enabled.
- `Timestamp`: inserts a timestamp field with `zerolog.TimestampFieldName` field name, formatted using `zerolog.TimeFieldFormat`.
- `Time`: adds a field with time formatted with `zerolog.TimeFieldFormat`.
- `Dur`: adds a field with `time.Duration`.
- `Dict`: adds a sub-key/value as a field of the event.
- `RawJSON`: adds a field with an already encoded JSON (`[]byte`).
- `Hex`: adds a field with value formatted as a hexadecimal string (`[]byte`).
- `Interface`: uses reflection to marshal the type.
- `IPAddr`: adds a field with `net.IP`.
- `IPPrefix`: adds a field with `net.IPNet`.
- `MACAddr`: adds a field with `net.HardwareAddr`.

Most fields are also available in the slice format (`Strs` for `[]string`, `Errs` for `[]error`, etc.). The full list is on `Event` in the [Go API](api) reference.

## Sub-dictionary

```go
log.Info().
    Str("foo", "bar").
    Dict("dict", zerolog.Dict().
        Str("bar", "baz").
        Int("n", 1),
    ).Msg("hello world")

// Output: {"level":"info","time":1494567715,"foo":"bar","dict":{"bar":"baz","n":1},"message":"hello world"}
```

## Customize automatic field names

```go
zerolog.TimestampFieldName = "t"
zerolog.LevelFieldName = "l"
zerolog.MessageFieldName = "m"

log.Info().Msg("hello world")

// Output: {"l":"info","t":1494567715,"m":"hello world"}
```

## Add contextual fields to the global logger

```go
log.Logger = log.With().Str("foo", "bar").Logger()
```

## Add file and line number

Equivalent of `Llongfile`:

```go
log.Logger = log.With().Caller().Logger()
log.Info().Msg("hello world")

// Output: {"level": "info", "message": "hello world", "caller": "/go/src/your_project/some_file:21"}
```

Equivalent of `Lshortfile`:

```go
zerolog.CallerMarshalFunc = func(pc uintptr, file string, line int) string {
    return filepath.Base(file) + ":" + strconv.Itoa(line)
}
log.Logger = log.With().Caller().Logger()
log.Info().Msg("hello world")

// Output: {"level": "info", "message": "hello world", "caller": "some_file:21"}
```

## Hooks

```go
type SeverityHook struct{}

func (h SeverityHook) Run(e *zerolog.Event, level zerolog.Level, msg string) {
    if level != zerolog.NoLevel {
        e.Str("severity", level.String())
    }
}

hooked := log.Hook(SeverityHook{})
hooked.Warn().Msg("")

// Output: {"level":"warn","severity":"warn"}
```

A hook runs on every event of its logger. `HookFunc` is the function form of the same interface; `Logger.Hook` attaches a hook to a logger, and `Event` hooks can also read the event's context with `e.GetCtx()` — useful to log trace and span IDs stored in a `context.Context`. See [Integrations](integrations) for the tracing example.

## Pass a sub-logger by context

```go
ctx := log.With().Str("component", "module").Logger().WithContext(ctx)

log.Ctx(ctx).Info().Msg("hello world")

// Output: {"component":"module","level":"info","message":"hello world"}
```

## context.Context integration

Go contexts are commonly passed throughout Go code, and this can help you pass your Logger into places it might otherwise be hard to inject. The `Logger` instance may be attached to Go context (`context.Context`) using `Logger.WithContext(ctx)` and extracted from it using `zerolog.Ctx(ctx)`:

```go
func f() {
    logger := zerolog.New(os.Stdout)
    ctx := context.Background()

    // Attach the Logger to the context.Context
    ctx = logger.WithContext(ctx)
    someFunc(ctx)
}

func someFunc(ctx context.Context) {
    // Get Logger from the go Context. if it's nil, then
    // `zerolog.DefaultContextLogger` is returned, if
    // `DefaultContextLogger` is nil, then a disabled logger is returned.
    logger := zerolog.Ctx(ctx)
    logger.Info().Msg("Hello")
}
```

A second form of `context.Context` integration allows you to pass the current `context.Context` into the logged event, and retrieve it from hooks. This can be useful to log trace and span IDs or other information stored in the go context, and facilitates the unification of logging and tracing in some systems:

```go
type TracingHook struct{}

func (h TracingHook) Run(e *zerolog.Event, level zerolog.Level, msg string) {
    ctx := e.GetCtx()
    spanId := getSpanIdFromContext(ctx) // as per your tracing framework
    e.Str("span-id", spanId)
}

func f() {
    // Setup the logger
    logger := zerolog.New(os.Stdout)
    logger = logger.Hook(TracingHook{})

    ctx := context.Background()
    // Use the Ctx function to make the context available to the hook
    logger.Info().Ctx(ctx).Msg("Hello")
}
```

## Global settings

Some settings can be changed and will be applied to all loggers:

- `log.Logger`: set this value to customize the global logger (the one used by package level methods).
- `zerolog.SetGlobalLevel`: can raise the minimum level of all loggers. Call this with `zerolog.Disabled` to disable logging altogether (quiet mode).
- `zerolog.DisableSampling`: if argument is `true`, all sampled loggers will stop sampling and issue 100% of their log events.
- `zerolog.TimestampFieldName`: customize the `Timestamp` field name.
- `zerolog.LevelFieldName`: customize the level field name.
- `zerolog.MessageFieldName`: customize the message field name.
- `zerolog.ErrorFieldName`: customize the `Err` field name.
- `zerolog.TimeFieldFormat`: customize the `Time` field value formatting. If set with `zerolog.TimeFormatUnix`, `zerolog.TimeFormatUnixMs` or `zerolog.TimeFormatUnixMicro`, times are formatted as UNIX timestamps.
- `zerolog.DurationFieldUnit`: customize the unit for `time.Duration` type fields added by `Dur` (default: `time.Millisecond`).
- `zerolog.DurationFieldFormat`: set to `DurationFormatFloat`, `DurationFormatInt`, or `DurationFormatString` (default: `DurationFormatFloat`) to append the `Duration` as a `Float64`, `Int64`, or by calling `String()` (respectively).
- `zerolog.ErrorHandler`: called whenever zerolog fails to write an event on its output. If not set, an error is printed on stderr. This handler must be thread safe and non-blocking.
- `zerolog.FloatingPointPrecision`: if set to a value other than -1, controls the number of digits when formatting float numbers in JSON. See [strconv.FormatFloat](https://pkg.go.dev/strconv#FormatFloat) for more details.
