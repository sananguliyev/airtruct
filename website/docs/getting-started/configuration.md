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

## Docker Compose with PostgreSQL

Edit `docker-compose.yml` to use PostgreSQL:

1. Uncomment the `postgres` service section.
2. Uncomment the PostgreSQL environment variables in the `coordinator` service.
3. Comment out the SQLite environment variables.
4. Uncomment the `depends_on` section for the coordinator.
5. Uncomment the `postgres_data` volume at the bottom.

Then run:

```bash
docker-compose up
```

## YAML Configuration File

You can load configuration from a YAML file using the `-config` flag:

```bash
./airtruct -config config.yaml -role coordinator -grpc-port 50000
```

See [CLI Reference](/docs/reference/cli) for all available flags and [Environment Variables](/docs/reference/environment-variables) for the full list.
