# Kafka to PostgreSQL Streaming Tutorial

This tutorial demonstrates how to set up a complete streaming pipeline from Kafka to PostgreSQL using Airtruct. You'll learn how to:

1. Set up the development environment
2. Create a PostgreSQL table
3. Create a Kafka topic in Redpanda
4. Register an Avro schema
5. Configure an Airtruct stream
6. Test the end-to-end flow

## Prerequisites

- Docker and Docker Compose installed
- Basic knowledge of SQL and Kafka concepts
- Airtruct CLI installed and running

## Step 1: Start the Development Environment

First, let's start all the required services:

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

Connect to PostgreSQL and create a sample table. For this tutorial, we'll create an `events` table:

```bash
docker exec -it postgres psql -U postgres -d mydb
```

Create the table:

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verify the table was created
\dt
\d events
```

Exit the PostgreSQL session:

```sql
\q
```

## Step 3: Create Kafka Topic

Open the Redpanda Console at `http://localhost:18080` and:

1. Navigate to **Topics**
2. Click **Create Topic**
3. Enter topic name: `application-events`
4. Set partitions: `1`
5. Set replication factor: `1`
6. Click **Create**

Alternatively, you can create the topic via CLI:

```bash
docker exec -it redpanda rpk topic create application-events --partitions 1
```

## Step 4: Register Avro Schema

Create a simplified Avro schema that matches our PostgreSQL table structure:

```bash
curl -X POST http://localhost:8081/subjects/application-events-value/versions \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{
    "schema": "{\"type\":\"record\",\"name\":\"Event\",\"fields\":[{\"name\":\"event_type\",\"type\":\"string\"},{\"name\":\"user_id\",\"type\":\"string\"},{\"name\":\"message\",\"type\":\"string\"}]}"
  }'
```

Verify the schema was registered:

```bash
curl http://localhost:8081/subjects/application-events-value/versions/latest
```

## Step 5: Create Airtruct Stream

Now let's create the Airtruct stream configuration. Open the Airtruct UI and:

1. Navigate to **Streams**
2. Click **Create New Stream**
3. Enter stream name: `kafka-to-psql-events`
4. Configure the stream as follows:

### Input Configuration (Kafka)

```yaml
brokers: ["localhost:9092"]
topic: application-events
consumer_group: event-stream-group
```

### Processor Configuration (Avro Decoder)

```yaml
schema_registry_url: "http://localhost:8081"
subject: "application-events-value"
```

### Output Configuration (PostgreSQL Insert)

```yaml
driver: postgres
dsn: postgres://postgres:${db_pass}@localhost:5432/mydb?sslmode=disable
table: events
columns: ["event_type", "user_id", "message"]
args_mapping: |
    root = [
        this.event_type,
        this.user_id,
        this.message,
      ]
```

## Step 6: Start the Stream

1. Save the stream configuration
2. Click **Start Stream**
3. Monitor the stream status in the dashboard

## Step 7: Test with Sample Data

Let's produce some Avro-encoded messages to test our pipeline:

### Generate Sample Data

The `produce_event.py` script automatically generates random sample data for testing. The script creates events with the following structure:

```json
{
  "event_type": "user_signup",
  "user_id": "user_456", 
  "message": "New user signed up with premium plan and email alice@example.com"
}
```

### Send Test Messages

Since Redpanda Console doesn't support Avro message production, we'll use the provided Python script to send properly formatted Avro messages.

First, install the required Python dependencies:

```bash
pip install confluent-kafka fastavro requests
```

The example includes a `produce_event.py` script that automatically generates and sends sample events for all event types:

The script automatically:
1. Fetches the registered Avro schema from Schema Registry
2. Generates random sample data for 3 different event types:
   - **user_signup**: New user registrations with random plans and emails
   - **button_click**: UI interaction events with various buttons and pages  
   - **purchase_completed**: Transaction completion events with random amounts and currencies
3. Serializes each message using the proper Confluent format (magic byte + schema ID + Avro data)
4. Produces all messages to Kafka

Run the script to send all sample events:

```bash
cd examples/kafka-to-psql
python produce_event.py
```

Example output:
```
Fetching schema from Schema Registry...
Using schema ID: 1

Sending 3 sample events...
Sent event: user_signup for user_456
Message delivered to application-events [0]
Sent event: button_click for user_789
Message delivered to application-events [0]
Sent event: purchase_completed for user_234
Message delivered to application-events [0]

All 3 events sent successfully!

To view the events in PostgreSQL:
docker exec -it postgres psql -U postgres -d mydb -c "SELECT * FROM events ORDER BY created_at DESC;"
```

Each run of the script generates fresh random data, so you can run it multiple times to create more test data.

## Step 8: Verify Data Flow

Check that data has been inserted into PostgreSQL:

```bash
docker exec -it postgres psql -U postgres -d mydb -c "SELECT * FROM events ORDER BY created_at DESC;"
```

You should see 3 events (one of each type) in the PostgreSQL table with columns: `id`, `event_type`, `user_id`, `message`, and `created_at`.

Query specific event types:

```bash
docker exec -it postgres psql -U postgres -d mydb -c "SELECT event_type, COUNT(*) FROM events GROUP BY event_type;"
```

Expected output:
```
   event_type    | count 
-----------------+-------
 button_click    |     1
 purchase_completed |  1
 user_signup     |     1
```

View recent messages:

```bash
docker exec -it postgres psql -U postgres -d mydb -c "SELECT event_type, user_id, message, created_at FROM events ORDER BY created_at DESC LIMIT 5;"
```

## Monitoring and Troubleshooting

### Check Stream Status

In the Airtruct UI:
- Monitor stream health and throughput
- Check for any processing errors
- View message processing metrics

### Check Kafka Messages

Use Redpanda Console to:
- View topic messages
- Check consumer lag
- Monitor partition distribution

### PostgreSQL Logs

Check PostgreSQL logs for any insertion errors:

```bash
docker logs postgres
```

### Stream Logs

Check Airtruct stream logs for processing errors:

```bash
# Check worker logs in Airtruct UI or CLI
airtruct logs stream kafka-to-psql-events
```

## Advanced Configuration

### Schema Evolution

To handle schema changes:

1. Register new schema version
2. Update processor configuration
3. Restart the stream

### Error Handling

Add error handling to your stream:

```yaml
schema_registry_url: "http://localhost:8081"
subject: "application-events-value"
on_error: "skip"
```

## Cleanup

To stop and remove all services:

```bash
docker-compose down -v
```

## Next Steps

- Try different event types and data structures
- Implement data transformations and filtering
- Add monitoring and alerting
- Scale the pipeline with multiple workers
- Explore other input/output connectors
- Build event analytics dashboards

## Troubleshooting Common Issues

### Connection Issues

- Ensure all services are running: `docker-compose ps`
- Check network connectivity between services
- Verify port mappings in docker-compose.yml

### Schema Registry Issues

- Verify schema registration: `curl http://localhost:8081/subjects`
- Check schema compatibility
- Ensure Avro format is correctly specified

### PostgreSQL Issues

- Check table permissions
- Verify column types match Avro schema
- Monitor PostgreSQL logs for constraint violations
- Note: The simplified schema uses only required string fields to avoid type conversion issues

### Common Event Streaming Patterns

This tutorial demonstrates several common event streaming patterns:

- **Event Capture**: Capturing application events in real-time
- **Schema Evolution**: Managing data structure changes over time
- **Event Storage**: Persisting events for analytics and replay
- **Real-time Processing**: Processing events as they arrive

---

This tutorial provides a complete end-to-end example of streaming events from Kafka to PostgreSQL using Airtruct. The pipeline handles Avro deserialization and provides a robust foundation for real-time event processing and analytics. 
