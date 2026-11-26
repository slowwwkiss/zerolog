---
title: Writers and output
description: ConsoleWriter pretty logging, multiple outputs with MultiLevelWriter, the lock-free diode writer, and syslog and journald writers.
---

# Writers and output

A zerolog `Logger` writes to any `io.Writer`. `zerolog.New` takes the writer; the global logger writes to `os.Stderr` by default.

## Pretty logging

To log a human-friendly, colorized output, use `zerolog.ConsoleWriter`:

```go
log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

log.Info().Str("foo", "bar").Msg("Hello world")

// Output: 3:04PM INF Hello World foo=bar
```

To customize the configuration and formatting:

```go
output := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
output.FormatLevel = func(i interface{}) string {
    return strings.ToUpper(fmt.Sprintf("| %-6s|", i))
}
output.FormatMessage = func(i interface{}) string {
    return fmt.Sprintf("***%s****", i)
}
output.FormatFieldName = func(i interface{}) string {
    return fmt.Sprintf("%s:", i)
}
output.FormatFieldValue = func(i interface{}) string {
    return strings.ToUpper(fmt.Sprintf("%s", i))
}

log := zerolog.New(output).With().Timestamp().Logger()

log.Info().Str("foo", "bar").Msg("Hello World")

// Output: 2006-01-02T15:04:05Z07:00 | INFO  | ***Hello World**** foo:BAR
```

To use custom advanced formatting:

```go
output := zerolog.ConsoleWriter{Out: os.Stdout, NoColor: true,
    PartsOrder:    []string{"level", "one", "two", "three", "message"},
    FieldsExclude: []string{"one", "two", "three"}}
output.FormatLevel = func(i interface{}) string { return strings.ToUpper(fmt.Sprintf("%-6s", i)) }
output.FormatFieldName = func(i interface{}) string { return fmt.Sprintf("%s:", i) }
output.FormatPartValueByName = func(i interface{}, s string) string {
    var ret string
    switch s {
    case "one":
        ret = strings.ToUpper(fmt.Sprintf("%s", i))
    case "two":
        ret = strings.ToLower(fmt.Sprintf("%s", i))
    case "three":
        ret = strings.ToLower(fmt.Sprintf("(%s)", i))
    }
    return ret
}
log := zerolog.New(output)

log.Info().Str("foo", "bar").
    Str("two", "TEST_TWO").
    Str("one", "test_one").
    Str("three", "test_three").
    Msg("Hello World")

// Output: INFO   TEST_ONE test_two (test_three) Hello World foo:bar
```

Console output is for humans, not machines: it is the provided but inefficient writer. Keep JSON for anything a log pipeline will read.

## Multiple log outputs

`zerolog.MultiLevelWriter` may be used to send the log message to multiple outputs. In this example, we send the log message to both `os.Stdout` and the in-built `ConsoleWriter`:

```go
func main() {
    consoleWriter := zerolog.ConsoleWriter{Out: os.Stdout}
    multi := zerolog.MultiLevelWriter(consoleWriter, os.Stdout)
    logger := zerolog.New(multi).With().Timestamp().Logger()
    logger.Info().Msg("Hello World!")
}

// Output (Line 1: Console; Line 2: Stdout)
// 12:36PM INF Hello World!
// {"level":"info","time":"2019-11-07T12:36:38+03:00","message":"Hello World!"}
```

## Thread-safe, lock-free, non-blocking writer

If your writer might be slow or not thread-safe and you need your log producers to never get slowed down by a slow writer, you can use a `diode.Writer` as follows:

```go
wr := diode.NewWriter(os.Stdout, 1000, 10*time.Millisecond, func(missed int) {
        fmt.Printf("Logger Dropped %d messages", missed)
    })
log := zerolog.New(wr)
log.Print("test")
```

You will need to install `code.cloudfoundry.org/go-diodes` to use this feature. The diode writer drops messages when its buffer is full and reports the count through the callback — producers are never blocked.

## syslog and journald

The package also ships writers for system logging: `zerolog.SyslogLevelWriter` writes to syslog, and the `journald` subpackage writes to systemd-journald. Both are in the [Go API](api) reference (`SyslogLevelWriter`, `journald` is a separate package in the module, not covered by this site's root-package reference).

## Binary encoding

In addition to the default JSON encoding, zerolog can produce binary logs using [CBOR](https://cbor.io) encoding. The choice of encoding can be decided at compile time using the build tag `binary_log` as follows:

```bash
go build -tags binary_log .
```

To decode binary encoded log files you can use any CBOR decoder. One that has been tested to work with the zerolog library is [CSD](https://github.com/toravir/csd/).
