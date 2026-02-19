---
sidebar_position: 1
---

# Inputs

Inputs define where data enters your pipeline. Select an input type when creating a stream in the UI.

## Generate

Generates synthetic messages for testing and development.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Mapping | Bloblang | — | Bloblang mapping to generate message content |
| Interval | string | `1s` | Time interval between messages |
| Count | integer | `0` | Number of messages to generate (0 = unlimited) |
| Batch Size | integer | `1` | Number of messages per batch |
| Auto Replay Nacks | boolean | `true` | Automatically replay rejected messages |

---

## HTTP Client

Pulls data from an HTTP endpoint by making requests at a configured interval.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| URL | string | — | The URL to send requests to |
| Verb | string | `GET` | HTTP method (GET, POST, PUT, DELETE) |
| Headers | map | — | HTTP headers to include |
| Timeout | string | `5s` | Request timeout |
| Retry Period | string | `1s` | Delay between retries |
| Retries | integer | `3` | Number of retries on failure |
| Rate Limit | string | — | Rate limit resource name |

Supports authentication: **Basic Auth**, **OAuth**, **OAuth2**, and **JWT**.

---

## HTTP Server

Accepts incoming HTTP requests — ideal for webhooks and event-driven data.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Path | string | `/post` | Endpoint path to listen on |
| Allowed Verbs | array | `POST` | HTTP methods to accept |
| Timeout | string | `5s` | Request timeout |
| Sync Response | object | — | Customize synchronous response |

:::tip
When using HTTP Server input, pair it with the [Sync Response](/docs/components/outputs#sync-response) output to return custom responses to the caller.
:::

---

## Kafka

Consumes messages from one or more Kafka topics.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Addresses | array | — | Kafka broker addresses |
| Topics | array | — | Topics to consume |
| Consumer Group | string | — | Consumer group ID |
| Checkpoint Limit | integer | `1024` | Max unprocessed messages before committing |
| Auto Replay Nacks | boolean | `true` | Automatically replay rejected messages |

Supports **SASL** authentication (PLAIN, SCRAM-SHA-256, SCRAM-SHA-512) and **TLS**.

---

## Broker

Combines multiple inputs into a single stream. Useful for fan-in patterns.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Copies | integer | `1` | Number of copies of each input |
| Inputs | array | — | List of input configurations |

---

## MySQL Replication

:::caution Experimental
This component is experimental and may change in future releases.
:::

Captures changes from MySQL/MariaDB binary log (CDC — Change Data Capture).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Host | string | — | MySQL server hostname |
| Port | integer | `3306` | MySQL server port |
| User | string | — | MySQL user |
| Password | string | — | MySQL password |
| Server ID | integer | — | Unique server ID for replication |
| Flavor | string | `mysql` | Database flavor (`mysql` or `mariadb`) |
| Include Table Regex | array | — | Tables to include (regex) |
| Exclude Table Regex | array | — | Tables to exclude (regex) |

Supports **GTID** and **file-based** position tracking.

---

## Shopify

Fetches data from Shopify stores via the Admin API.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Shop Name | string | — | Shopify shop name |
| API Token | string | — | Shopify Admin API token |
| API Secret Key | string | — | Shopify API secret |
| Resource | string | — | Resource type to fetch |
| Limit | integer | `50` | Results per page |
| Rate Limit | string | — | Rate limit resource name |
| Cache | string | — | Cache for position tracking |

Available resources: `products`, `orders`, `customers`, `inventory_items`, `locations`.
