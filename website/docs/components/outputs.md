---
sidebar_position: 3
---

# Outputs

Outputs define where processed data is delivered. Select an output type when creating a stream in the UI.

## HTTP Client

Sends messages to an HTTP endpoint.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| URL | string | — | The URL to send requests to |
| Verb | string | `POST` | HTTP method |
| Headers | map | — | HTTP headers |
| Timeout | string | `5s` | Request timeout |
| Retries | integer | `3` | Number of retries |
| Max In Flight | integer | `64` | Maximum parallel requests |
| Rate Limit | string | — | Rate limit resource name |
| Batching | object | — | Batching policy |

Supports authentication: **Basic Auth**, **OAuth**, **OAuth2**, and **JWT**.

---

## Kafka

Produces messages to a Kafka topic.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Addresses | array | — | Kafka broker addresses |
| Topic | string | — | Target topic |
| Key | string | — | Message key (Bloblang interpolation) |
| Compression | string | `none` | Compression: `none`, `gzip`, `snappy`, `lz4`, `zstd` |
| Max In Flight | integer | `64` | Maximum parallel produces |
| Batching | object | — | Batching policy |

Supports **SASL** authentication and **TLS**.

---

## SQL Insert

Inserts rows into a SQL database.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Driver | string | — | Database driver |
| DSN | string | — | Connection string |
| Table | string | — | Target table |
| Columns | array | — | Column names |
| Args Mapping | Bloblang | — | Maps message fields to column values |
| Suffix | string | — | Optional SQL suffix (e.g., `ON CONFLICT DO NOTHING`) |
| Max In Flight | integer | `64` | Maximum parallel inserts |
| Batching | object | — | Batching policy |

Supported drivers: `mysql`, `postgres`, `clickhouse`, `mssql`, `sqlite`, `oracle`, `snowflake`, `trino`, `cosmos`, `spanner`.

---

## Sync Response

Returns a response back through the input's HTTP connection. Use this with the [HTTP Server](/docs/components/inputs#http-server) input.

No configuration required — the processed message is returned as the HTTP response.

---

## Switch

Routes messages to different outputs based on conditions.

| Field | Type | Description |
|-------|------|-------------|
| Cases | array | List of condition/output pairs |
| Retry Until Success | boolean | Retry failed outputs |
| Strict Mode | boolean | Error if no case matches |

Each case has a **Check** condition (Bloblang expression) and an **Output** to route matching messages to.

---

## Broker

Routes messages to multiple outputs simultaneously.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Pattern | string | `fan_out` | Routing pattern |
| Outputs | array | — | List of output configurations |

Available patterns:
- `fan_out` — Send to all outputs in parallel.
- `fan_out_sequential` — Send to all outputs in order.
- `round_robin` — Distribute across outputs.
- `greedy` — Send to the first available output.

Variants with `_fail_fast` stop on first error.
