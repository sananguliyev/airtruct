---
sidebar_position: 3
---

# Configuration

Airtruct is configured through CLI flags and environment variables. You can also load configuration from a YAML file.

## Database

Set `DATABASE_DRIVER` and `DATABASE_URI` before starting the coordinator.

### SQLite

```bash
export DATABASE_DRIVER="sqlite"
export DATABASE_URI="file:./airtruct.sqlite?_foreign_keys=1&mode=rwc"
```

### PostgreSQL

URL format (recommended):

```bash
export DATABASE_DRIVER="postgres"
export DATABASE_URI="postgres://airtruct:yourpassword@localhost:5432/airtruct?sslmode=disable"
```

DSN format:

```bash
export DATABASE_DRIVER="postgres"
export DATABASE_URI="host=localhost user=airtruct password=yourpassword dbname=airtruct port=5432 sslmode=disable"
```

:::tip
For production PostgreSQL deployments, use `sslmode=require` or `sslmode=verify-full` and secure credentials.
:::

## Ports

| Flag | Default | Description |
|------|---------|-------------|
| `-http-port` | `8080` | HTTP port for the web UI and REST API |
| `-grpc-port` | — | gRPC port for coordinator-worker communication (required) |

When running both coordinator and worker on the same host, use different gRPC ports:

```bash
# Coordinator
./airtruct -role coordinator -grpc-port 50000

# Worker
./airtruct -role worker -grpc-port 50001
```

## YAML Configuration File

You can load configuration from a YAML file using the `-config` flag:

```bash
./airtruct -config config.yaml -role coordinator -grpc-port 50000
```

See [CLI Reference](/docs/reference/cli) for all available flags and [Environment Variables](/docs/reference/environment-variables) for the full list.
