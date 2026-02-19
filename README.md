# Airtruct

> ETL Pipelines, Made Simple — scale as you need, without the hassle.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)]() [![Status](https://img.shields.io/badge/Status-Early%20Development-orange.svg)]()

Airtruct is an open-source data pipeline tool — a lightweight, self-hosted alternative to Airbyte and Fivetran. Build and manage streams visually with a DAG-style UI, transform data with the built-in Bloblang DSL, and scale horizontally with a simple coordinator & worker architecture. Single binary, no Docker or JVM required.

**[Documentation](https://airtruct.com/)** | **[Guides](https://airtruct.com/docs/guides/kafka-to-postgresql)**

## Quick Start

**Download** the latest binary from the [Releases page](https://github.com/sananguliyev/airtruct/releases), then:

```bash
chmod +x airtruct

# Start coordinator
./airtruct -role coordinator -grpc-port 50000

# Start worker (in a separate terminal)
./airtruct -role worker -grpc-port 50001
```

Open **http://localhost:8080** and start building pipelines.

### Docker Compose

```bash
git clone https://github.com/sananguliyev/airtruct.git
cd airtruct
docker-compose up
```

See the [Configuration docs](https://airtruct.com/docs/getting-started/configuration) for database setup (SQLite, PostgreSQL) and other options.

## Examples

- [Kafka to PostgreSQL](examples/kafka-to-psql/) — Stream events from Kafka through Avro schema decoding into PostgreSQL.

## Contributing

We welcome contributions! Please check out [CONTRIBUTING](CONTRIBUTING) (coming soon) for guidelines.

## License

Apache 2.0 — see [LICENSE](LICENSE) for details.
