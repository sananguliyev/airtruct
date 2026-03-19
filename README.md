# Airtruct

> ETL Pipelines, Made Simple — scale as you need, without the hassle.

[![license](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE) [![Release](https://img.shields.io/github/v/release/sananguliyev/airtruct)](https://github.com/sananguliyev/airtruct/releases) [![Go Report Card](https://goreportcard.com/badge/github.com/sananguliyev/airtruct)](https://goreportcard.com/report/github.com/sananguliyev/airtruct)

Airtruct is an open-source data pipeline tool — a lightweight, self-hosted alternative to Airbyte and Fivetran. Build and manage flows visually with a pipeline builder UI, transform data with the built-in Bloblang DSL, and scale horizontally with a simple coordinator & worker architecture. **Expose flows as MCP tools** for AI assistants like Claude, Cursor, and other MCP-compatible clients. Single binary, no Docker or JVM required.

**[Documentation](https://airtruct.com/)** | **[Playbooks](https://airtruct.com/playbooks)**

## Quick Start

### Install

```bash
curl -Lsf https://airtruct.com/sh/install | bash
```

See the [Installation docs](https://airtruct.com/docs/getting-started/installation) for more options.

### Run

```bash
# Start coordinator
airtruct -role coordinator -grpc-port 50000

# Start worker (in a separate terminal)
airtruct -role worker -grpc-port 50001
```

Open **http://localhost:8080** and start building pipelines.

### Docker

```bash
docker pull ghcr.io/sananguliyev/airtruct
```

See the [Installation docs](https://airtruct.com/docs/getting-started/installation) for Docker run commands and the [Configuration docs](https://airtruct.com/docs/getting-started/configuration) for database setup.

## Features

- **Visual Pipeline Builder** — Drag and drop UI to build and manage data flows
- **Built-in Transformations** — Transform data with Bloblang DSL and JSON Schema validation
- **Horizontal Scaling** — Coordinator & worker architecture for easy scaling
- **MCP Integration** — Expose flows as tools for AI assistants via Model Context Protocol
- **Multiple Sources & Destinations** — Kafka, HTTP, AMQP, MySQL CDC, PostgreSQL, and more
- **Single Binary** — No Docker, JVM, or external dependencies required
- **Self-hosted** — Full control over your data and infrastructure

## Playbooks

- [Kafka to PostgreSQL](https://airtruct.com/playbooks/kafka-to-postgresql) — Flow events from Kafka through Avro schema decoding into PostgreSQL.
- [HTTP Webhooks](https://airtruct.com/playbooks/http-webhooks) — Accept webhook data over HTTP and store it in a database.
- [MCP Tool Integration](https://airtruct.com/playbooks/mcp-tool) — Expose flows as tools for AI assistants.

## Contributing

We welcome contributions! Please check out [CONTRIBUTING](CONTRIBUTING) (coming soon) for guidelines.

## License

Apache 2.0 — see [LICENSE](LICENSE) for details.
