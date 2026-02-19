# Kafka to PostgreSQL Streaming Tutorial

This tutorial demonstrates how to set up a complete streaming pipeline from Kafka to PostgreSQL using Airtruct. You'll learn how to:

1. Set up the development environment
2. Create a PostgreSQL table
3. Create a Kafka topic in Redpanda
4. Register an Avro schema
5. Configure an Airtruct stream
6. Test the end-to-end flow

> For full documentation, see the [Kafka to PostgreSQL guide](https://airtruct.com/docs/guides/kafka-to-postgresql).

## Prerequisites

- Docker and Docker Compose installed
- Basic knowledge of SQL and Kafka concepts
- Airtruct coordinator and worker running

## Step 1: Start the Development Environment

```bash
cd examples/kafka-to-psql
docker-compose up -d
```

This will start:
- **Redpanda** (Kafka-compatible): Available on `localhost:9092`
- **Schema Registry**: Available on `localhost:8081`
- **Redpanda Console**: Available on `http://localhost:18080`
- **PostgreSQL**: Available on `localhost:5432`

Wait for all services to be healthy:

```bash
docker-compose ps
```

## Step 2: Create PostgreSQL Table

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

## Step 3: Create Kafka Topic

```bash
docker exec -it redpanda rpk topic create application-events --partitions 1
```

## Step 4: Register Avro Schema

```bash
curl -X POST http://localhost:8081/subjects/application-events-value/versions \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{
    "schema": "{\"type\":\"record\",\"name\":\"Event\",\"fields\":[{\"name\":\"event_type\",\"type\":\"string\"},{\"name\":\"user_id\",\"type\":\"string\"},{\"name\":\"message\",\"type\":\"string\"}]}"
  }'
```

## Step 5: Create Airtruct Stream

Open the Airtruct UI, navigate to **Streams**, click **Create New Stream**, and enter stream name `kafka-to-psql-events`.

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

## Step 6: Test with Sample Data

Install the required Python dependencies and run the test producer:

```bash
pip install confluent-kafka fastavro requests
python produce_event.py
```

The script automatically:
1. Fetches the registered Avro schema from Schema Registry
2. Generates random sample data for 3 event types: `user_signup`, `button_click`, `purchase_completed`
3. Serializes each message using the Confluent format and produces to Kafka

## Step 7: Verify Data Flow

```bash
docker exec -it postgres psql -U postgres -d mydb -c "SELECT * FROM events ORDER BY created_at DESC;"
```

Query by event type:

```bash
docker exec -it postgres psql -U postgres -d mydb -c "SELECT event_type, COUNT(*) FROM events GROUP BY event_type;"
```

## Troubleshooting

- **Services not running** — `docker-compose ps` to verify all containers are healthy.
- **Schema issues** — `curl http://localhost:8081/subjects` to verify schema registration.
- **PostgreSQL errors** — `docker logs postgres` to check insertion errors.
- **Stream errors** — Check the Airtruct UI for stream status and processing errors.

## Cleanup

```bash
docker-compose down -v
```
