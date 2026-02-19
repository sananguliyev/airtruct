---
sidebar_position: 2
---

# Environment Variables

All Airtruct settings can be configured via environment variables.

## Runtime

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ROLE` | string | `coordinator` | Node role: `coordinator` or `worker` |
| `GRPC_PORT` | uint | — | gRPC server port (required) |
| `HTTP_PORT` | uint | `8080` | HTTP port for web UI and REST API |
| `DISCOVERY_URI` | string | `localhost:50000` | Coordinator address for worker discovery |
| `DEBUG_MODE` | bool | `false` | Enable debug logging |

## Database

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_DRIVER` | string | — | Database backend: `sqlite` or `postgres` |
| `DATABASE_URI` | string | — | Database connection string |

:::warning
If `DATABASE_DRIVER` and `DATABASE_URI` are not set, Airtruct stores data in memory. All data is lost when the process stops.
:::

### SQLite

```bash
export DATABASE_DRIVER="sqlite"
export DATABASE_URI="file:./airtruct.sqlite?_foreign_keys=1&mode=rwc"
```

### PostgreSQL

URL format:

```bash
export DATABASE_DRIVER="postgres"
export DATABASE_URI="postgres://airtruct:yourpassword@localhost:5432/airtruct?sslmode=disable"
```

DSN format:

```bash
export DATABASE_DRIVER="postgres"
export DATABASE_URI="host=localhost user=airtruct password=yourpassword dbname=airtruct port=5432 sslmode=disable"
```
