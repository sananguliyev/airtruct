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
3. Give the stream a name and set the desired status.
4. Configure the input, optional processors, and output using the visual builder.
5. Save the stream.

Each component is configured through its form in the visual editor. See [Validation](./validation) for how Airtruct checks your configuration before saving, and [Testing Streams](./testing-streams) for how to test your processor pipeline with sample data before activating.

## Stream Lifecycle

Streams have the following statuses:

| Status | Description |
|--------|-------------|
| **active** | Stream is queued to run and will be assigned to an available worker |
| **paused** | Stream is saved but not running; no worker will pick it up |
| **completed** | Stream finished processing (e.g., a finite input source was exhausted) |
| **failed** | Stream encountered an unrecoverable runtime error |

You can change a stream's status from the UI at any time. To save a stream with an invalid configuration, set the status to **paused** — Airtruct will reject saves with status **active** if the configuration does not pass validation.

## Assignment

When a stream is started, the coordinator assigns it to an available worker. The worker then runs the stream's pipeline. If a worker goes down, the coordinator can reassign the stream to another worker.

## Buffering

Streams support buffering to handle backpressure and ensure delivery:

- **Memory buffer** — In-memory with optional spillover.
- **SQLite buffer** — Persistent buffering for at-least-once delivery.
- **System Window** — Time-based windowing (tumbling, sliding, hopping).
