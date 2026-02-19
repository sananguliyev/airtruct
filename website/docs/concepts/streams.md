---
sidebar_position: 2
---

# Streams

A **stream** is the core building block in Airtruct. It defines a data pipeline that moves data from an input, through optional processors, to an output.

## Structure

Every stream consists of three parts:

```
Input → Processors → Output
```

- **Input**: Where data comes from (Kafka, HTTP, database CDC, etc.).
- **Processors**: Optional transformations applied to each message (mapping, validation, schema decoding, etc.).
- **Output**: Where data goes (database, Kafka, HTTP endpoint, etc.).

## Creating Streams

Streams are created through the Airtruct web UI:

1. Open the console at `http://localhost:8080`.
2. Click **Create New Stream**.
3. Give the stream a name.
4. Configure the input, processors, and output using the visual editor or YAML.
5. Save and start the stream.

Each component is configured with YAML. The visual editor provides forms for common settings.

## Stream Lifecycle

Streams have the following states:

| State | Description |
|-------|-------------|
| **Created** | Stream is defined but not running |
| **Running** | Stream is actively processing data |
| **Stopped** | Stream was manually stopped |
| **Error** | Stream encountered an error |

You can start, stop, and update streams from the UI at any time.

## Assignment

When a stream is started, the coordinator assigns it to an available worker. The worker then runs the stream's pipeline. If a worker goes down, the coordinator can reassign the stream to another worker.

## Buffering

Streams support buffering to handle backpressure and ensure delivery:

- **Memory buffer** — In-memory with optional spillover.
- **SQLite buffer** — Persistent buffering for at-least-once delivery.
- **System Window** — Time-based windowing (tumbling, sliding, hopping).
