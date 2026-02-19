---
sidebar_position: 1
---

# Kafka to PostgreSQL

This guide walks through setting up a complete streaming pipeline from Kafka to PostgreSQL with Avro schema decoding.

## Prerequisites

- Docker and Docker Compose installed
- Airtruct coordinator and worker running ([Installation](/docs/getting-started/installation))

## 1. Start the Development Environment

```bash
cd examples/kafka-to-psql
docker-compose up -d
```

This starts:
- **Redpanda** (Kafka-compatible) on `localhost:9092`
- **Schema Registry** on `localhost:8081`
- **Redpanda Console** on `http://localhost:18080`
- **PostgreSQL** on `localhost:5432`

## 2. Create the PostgreSQL Table

```bash
docker exec -it postgres psql -U postgres -d mydb
```

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Create a Kafka Topic

```bash
docker exec -it redpanda rpk topic create application-events --partitions 1
```

## 4. Register an Avro Schema

```bash
curl -X POST http://localhost:8081/subjects/application-events-value/versions \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{
    "schema": "{\"type\":\"record\",\"name\":\"Event\",\"fields\":[{\"name\":\"event_type\",\"type\":\"string\"},{\"name\":\"user_id\",\"type\":\"string\"},{\"name\":\"message\",\"type\":\"string\"}]}"
  }'
```

## 5. Create the Airtruct Stream

Open the Airtruct UI, click **Create New Stream**, and configure each section:

### Input — select **Kafka**

| Field | Value |
|-------|-------|
| Addresses | `localhost:9092` |
| Topics | `application-events` |
| Consumer Group | `event-stream-group` |

### Processor — select **Schema Registry Decode**

| Field | Value |
|-------|-------|
| URL | `http://localhost:8081` |

### Output — select **SQL Insert**

| Field | Value |
|-------|-------|
| Driver | `postgres` |
| DSN | `postgres://postgres:postgres@localhost:5432/mydb?sslmode=disable` |
| Table | `events` |
| Columns | `event_type`, `user_id`, `message` |
| Args Mapping | `root = [this.event_type, this.user_id, this.message]` |

Click **Save** and then **Start** the stream.

## 6. Send Test Data

Install dependencies and run the test producer:

```bash
pip install confluent-kafka fastavro requests
cd examples/kafka-to-psql
python produce_event.py
```

The script sends sample events for `user_signup`, `button_click`, and `purchase_completed`.

## 7. Verify

```bash
docker exec -it postgres psql -U postgres -d mydb \
  -c "SELECT * FROM events ORDER BY created_at DESC;"
```

## Cleanup

```bash
docker-compose down -v
```
