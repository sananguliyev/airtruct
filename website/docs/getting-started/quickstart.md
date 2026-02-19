---
sidebar_position: 2
---

# Quickstart

Get a working Airtruct pipeline running in under 5 minutes.

## 1. Set Up Database

Airtruct supports SQLite and PostgreSQL. Set environment variables before running the coordinator, otherwise data is stored in memory and lost on restart.

### SQLite (simplest)

```bash
export DATABASE_DRIVER="sqlite"
export DATABASE_URI="file:./airtruct.sqlite?_foreign_keys=1&mode=rwc"
```

### PostgreSQL

```bash
export DATABASE_DRIVER="postgres"
export DATABASE_URI="postgres://airtruct:yourpassword@localhost:5432/airtruct?sslmode=disable"
```

## 2. Start Coordinator

```bash
./airtruct -role coordinator -grpc-port 50000
```

This starts the coordinator on gRPC port `50000` and the web UI on `http://localhost:8080`.

## 3. Start a Worker

In a separate terminal:

```bash
./airtruct -role worker -grpc-port 50001
```

The worker automatically discovers and registers with the coordinator.

## 4. Create Your First Stream

Open `http://localhost:8080` in your browser. You'll see the Airtruct console.

1. Click **Create New Stream**.
2. Give it a name (e.g., `my-first-stream`).
3. Configure an **input** — select **Generate** to produce test messages:

| Field | Value |
|-------|-------|
| Mapping | `root.id = uuid_v4()` / `root.message = "hello world"` / `root.timestamp = now()` |
| Interval | `1s` |
| Count | `0` (unlimited) |

4. Optionally add a **processor** — select **Mapping** to transform data:

| Field | Value |
|-------|-------|
| Mapping | `root.message = this.message.uppercase()` / `root.processed_at = now()` |

5. Configure an **output** — select **HTTP Client** to send data somewhere, or use **Drop** to discard (useful for testing).

6. Click **Start** to run the stream.

## Next Steps

- Learn about [Streams](/docs/concepts/streams) and how they work.
- See all available [Components](/docs/concepts/components).
- Try the [Kafka to PostgreSQL](/docs/guides/kafka-to-postgresql) tutorial for a real-world example.
