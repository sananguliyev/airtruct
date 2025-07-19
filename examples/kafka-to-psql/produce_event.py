import requests
import io
import struct
import json
import random
import time
from confluent_kafka import Producer
from fastavro import parse_schema, schemaless_writer

# Config
SCHEMA_REGISTRY_URL = "http://localhost:8081"
TOPIC = "application-events"
KAFKA_BOOTSTRAP = "localhost:9092"
SUBJECT = f"{TOPIC}-value"

# Sample data generators
def generate_sample_events():
    """Generate sample events with random data"""
    events = [
        {
            "event_type": "user_signup",
            "user_id": f"user_{random.randint(100, 999)}",
            "message": f"New user signed up with {random.choice(['premium', 'basic', 'enterprise'])} plan and email {random.choice(['alice', 'bob', 'charlie'])}@{random.choice(['example.com', 'test.org', 'demo.net'])}"
        },
        {
            "event_type": "button_click",
            "user_id": f"user_{random.randint(100, 999)}",
            "message": f"User clicked {random.choice(['checkout', 'login', 'subscribe', 'download'])} button on {random.choice(['cart', 'home', 'product', 'landing'])} page"
        },
        {
            "event_type": "purchase_completed",
            "user_id": f"user_{random.randint(100, 999)}",
            "message": f"Purchase completed for order ord_{random.randint(10000, 99999)} with amount ${random.randint(10, 500):.2f} {random.choice(['USD', 'EUR', 'GBP'])}"
        }
    ]
    return events

def serialize_and_produce(producer, parsed_schema, schema_id, record):
    """Serialize a record and produce it to Kafka"""
    # Step 3: Serialize the record using Confluent framing (magic byte + schema ID)
    bytes_writer = io.BytesIO()
    # Magic byte
    bytes_writer.write(struct.pack("b", 0))
    # 4-byte schema ID
    bytes_writer.write(struct.pack(">I", schema_id))
    # Avro-encoded payload
    schemaless_writer(bytes_writer, parsed_schema, record)
    avro_bytes = bytes_writer.getvalue()
    
    # Produce to Kafka
    producer.produce(TOPIC, value=avro_bytes, callback=delivery_report)
    print(f"Sent event: {record['event_type']} for {record['user_id']}")

def delivery_report(err, msg):
    if err is not None:
        print("Delivery failed:", err)
    else:
        print(f"Message delivered to {msg.topic()} [{msg.partition()}]")

def main():
    # Step 1: Fetch the schema from Schema Registry
    print("Fetching schema from Schema Registry...")
    resp = requests.get(f"{SCHEMA_REGISTRY_URL}/subjects/{SUBJECT}/versions/latest")
    resp.raise_for_status()
    schema_response = resp.json()
    schema_id = schema_response["id"]
    avro_schema = schema_response["schema"]

    # Step 2: Parse the schema
    parsed_schema = parse_schema(json.loads(avro_schema))
    print(f"Using schema ID: {schema_id}")

    # Step 4: Create producer
    producer = Producer({"bootstrap.servers": KAFKA_BOOTSTRAP})

    # Generate and send sample events
    events = generate_sample_events()
    
    print(f"\nSending {len(events)} sample events...")
    for i, record in enumerate(events):
        serialize_and_produce(producer, parsed_schema, schema_id, record)
        time.sleep(0.5)  # Small delay between messages
    
    # Wait for all messages to be delivered
    producer.flush()
    print(f"\nAll {len(events)} events sent successfully!")
    print("\nTo view the events in PostgreSQL (in case stream is configured to write to PostgreSQL)")
    print("docker exec -it postgres psql -U postgres -d mydb -c \"SELECT * FROM events ORDER BY created_at DESC;\"")

if __name__ == "__main__":
    main()
