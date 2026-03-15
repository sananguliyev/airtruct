---
sidebar_position: 3
---

# Configuration

Airtruct supports three configuration methods. When the same setting is specified in multiple places, the precedence is:

1. **CLI flags** (highest priority)
2. **Environment variables**
3. **YAML configuration file**
4. **Default values** (lowest priority)

## YAML Configuration File

Define all settings in a single YAML file and load it with the `-config` flag:

```yaml
role: coordinator
grpc-port: 50000
http-port: 8080
discovery-uri: localhost:50000
debug: false

database:
  driver: sqlite
  uri: "file:./airtruct.sqlite?_foreign_keys=1&mode=rwc"

secret:
  key: "this_is_a_32_byte_key_for_AES!!!"

auth:
  type: none
```

```bash
./airtruct -config config.yaml
```

A complete example is available in the repository at `config.example.yaml`.

CLI flags and environment variables override YAML values. For example, this starts a worker regardless of what the YAML file says:

```bash
./airtruct -config config.yaml -role worker -grpc-port 50001
```

### Environment Variable Interpolation

YAML values support `${VAR}` interpolation, allowing you to reference environment variables directly in the config file. Use `${VAR:-default}` to provide a fallback when the variable is not set:

```yaml
database:
  driver: "${DB_DRIVER:-postgres}"
  uri: "postgres://${PG_USER:-airtruct}:${PG_PASS}@${PG_HOST:-localhost}:${PG_PORT:-5432}/${PG_DB:-airtruct}?sslmode=disable"

secret:
  key: "${SECRET_KEY}"
```

This is especially useful for keeping sensitive values out of config files while still having a complete, shareable configuration template.

### Docker with YAML Config

Mount a config file into the container and reference it in the command:

```bash
docker run -d --name airtruct-coordinator \
  -p 8080:8080 -p 50000:50000 \
  -v airtruct-data:/data \
  -v ./config.yaml:/etc/airtruct/config.yaml \
  ghcr.io/sananguliyev/airtruct -config /etc/airtruct/config.yaml
```

You can still override specific values with environment variables:

```bash
docker run -d --name airtruct-coordinator \
  -p 8080:8080 -p 50000:50000 \
  -e SECRET_KEY="production-secret-key-here!!!!" \
  -v airtruct-data:/data \
  -v ./config.yaml:/etc/airtruct/config.yaml \
  ghcr.io/sananguliyev/airtruct -config /etc/airtruct/config.yaml
```

## Environment Variables

All settings can also be configured through environment variables without a YAML file:

```bash
export DATABASE_DRIVER="sqlite"
export DATABASE_URI="file:./airtruct.sqlite?_foreign_keys=1&mode=rwc"
export SECRET_KEY="this_is_a_32_byte_key_for_AES!!!"
./airtruct -role coordinator -grpc-port 50000
```

## Database

### SQLite

```yaml
database:
  driver: sqlite
  uri: "file:./airtruct.sqlite?_foreign_keys=1&mode=rwc"
```

Or via environment variables:

```bash
export DATABASE_DRIVER="sqlite"
export DATABASE_URI="file:./airtruct.sqlite?_foreign_keys=1&mode=rwc"
```

### PostgreSQL

```yaml
database:
  driver: postgres
  uri: "postgres://${PG_USER:-airtruct}:${PG_PASS}@${PG_HOST:-localhost}:5432/${PG_DB:-airtruct}?sslmode=disable"
```

Or via environment variables:

```bash
export DATABASE_DRIVER="postgres"
export DATABASE_URI="postgres://airtruct:yourpassword@localhost:5432/airtruct?sslmode=disable"
```

:::tip
For production PostgreSQL deployments, use `sslmode=require` or `sslmode=verify-full` and secure credentials.
:::

## Secret Key

A 32-byte encryption key is required for storing secrets:

```yaml
secret:
  key: "this_is_a_32_byte_key_for_AES!!!"
```

## All Settings

| Flag | Env Var | YAML Key | Default | Description |
|------|---------|----------|---------|-------------|
| `-role` | `ROLE` | `role` | `coordinator` | Node role (`coordinator` or `worker`) |
| `-grpc-port` | `GRPC_PORT` | `grpc-port` | `50000` | gRPC port for coordinator-worker communication |
| `-http-port` | `HTTP_PORT` | `http-port` | `8080` | HTTP port for web UI and API |
| `-discovery-uri` | `DISCOVERY_URI` | `discovery-uri` | `localhost:50000` | Coordinator address for workers |
| `-debug` | `DEBUG_MODE` | `debug` | `false` | Enable debug logging |
| `--database.driver` | `DATABASE_DRIVER` | `database.driver` | `sqlite` | Database driver |
| `--database.uri` | `DATABASE_URI` | `database.uri` | — | Database URI (required for coordinator) |
| `--secret.key` | `SECRET_KEY` | `secret.key` | — | Encryption key (required, 32 bytes) |
| `--auth.type` | `AUTH_TYPE` | `auth.type` | `none` | Auth type: `none`, `basic`, or `oauth2` |
| `--auth.basic-username` | `AUTH_BASIC_USERNAME` | `auth.basic-username` | — | Basic auth username |
| `--auth.basic-password` | `AUTH_BASIC_PASSWORD` | `auth.basic-password` | — | Basic auth password |

See [Keycloak Authentication](/docs/guides/keycloak-authentication) for OAuth2 settings.

## Running Multiple Nodes

When running both coordinator and worker on the same host, use different gRPC ports:

```bash
# Coordinator
./airtruct -config config.yaml -role coordinator -grpc-port 50000

# Worker
./airtruct -config config.yaml -role worker -grpc-port 50001
```

Or use separate YAML files for each role.
