---
sidebar_position: 3
---

# Components

Components are the building blocks of streams. Each stream uses one input, zero or more processors, and one output.

## Inputs

Inputs define where data enters the pipeline.

| Component | Description |
|-----------|-------------|
| [Generate](/docs/components/inputs#generate) | Generates synthetic messages for testing |
| [HTTP Client](/docs/components/inputs#http-client) | Pulls data via HTTP requests |
| [HTTP Server](/docs/components/inputs#http-server) | Accepts incoming HTTP requests (webhooks) |
| [Kafka](/docs/components/inputs#kafka) | Consumes messages from Kafka topics |
| [Broker](/docs/components/inputs#broker) | Combines multiple inputs into one stream |
| [MySQL Replication](/docs/components/inputs#mysql-replication) | CDC from MySQL/MariaDB binlog |
| [Shopify](/docs/components/inputs#shopify) | Fetches data from Shopify stores |

## Processors

Processors transform, validate, or route messages within the pipeline.

| Component | Description |
|-----------|-------------|
| [Mapping](/docs/components/processors#mapping) | Bloblang transformations |
| [JSON Schema](/docs/components/processors#json-schema) | Validates messages against a JSON schema |
| [Catch](/docs/components/processors#catch) | Error handling — runs processors on failure |
| [Switch](/docs/components/processors#switch) | Conditional processing based on message content |
| [Schema Registry Decode](/docs/components/processors#schema-registry-decode) | Decodes Avro messages via Schema Registry |

## Outputs

Outputs define where data is delivered.

| Component | Description |
|-----------|-------------|
| [HTTP Client](/docs/components/outputs#http-client) | Sends data via HTTP requests |
| [Kafka](/docs/components/outputs#kafka) | Produces messages to Kafka topics |
| [SQL Insert](/docs/components/outputs#sql-insert) | Inserts rows into SQL databases |
| [Sync Response](/docs/components/outputs#sync-response) | Returns response to HTTP Server input |
| [Switch](/docs/components/outputs#switch) | Conditional routing to different outputs |
| [Broker](/docs/components/outputs#broker) | Routes messages to multiple outputs |

## Other Components

### Caches

Caches provide state storage for components like Shopify position tracking.

| Cache | Description |
|-------|-------------|
| Memory | In-memory with TTL |
| Redis | Distributed caching |
| Memcached | Distributed memory caching |
| File | File-based persistence |
| LRU | Least Recently Used with capacity limits |
| TTLRU | TTL-aware LRU |
| Ristretto | High-performance cache |

### Rate Limits

| Rate Limit | Description |
|------------|-------------|
| Coordinator | Distributed rate limiting across workers |

### Buffers

| Buffer | Description |
|--------|-------------|
| Memory | In-memory buffering |
| SQLite | Persistent at-least-once delivery |
| System Window | Time-based windowing |
