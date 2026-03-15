---
sidebar_position: 1
---

# Installation

Airtruct runs as a single binary with no external dependencies. Choose the method that works best for you.

## Install Script

Download and install the latest release automatically:

```bash
curl -Lsf https://airtruct.com/sh/install | bash
```

To install a specific version:

```bash
curl -Lsf https://airtruct.com/sh/install | bash -s -- 0.2.0
```

## Docker

Pull the latest official image:

```bash
docker pull ghcr.io/sananguliyev/airtruct
```

Run the coordinator and worker:

```bash
# Start coordinator
docker run -d --name airtruct-coordinator \
  -p 8080:8080 -p 50000:50000 \
  -e DATABASE_DRIVER=sqlite \
  -e DATABASE_URI="file:/data/airtruct.sqlite?_foreign_keys=1&mode=rwc" \
  -e SECRET_KEY="this_is_a_32_byte_key_for_AES!!!" \
  -v airtruct-data:/data \
  ghcr.io/sananguliyev/airtruct -role coordinator -grpc-port 50000

# Start worker
docker run -d --name airtruct-worker \
  -e DATABASE_DRIVER=sqlite \
  -e DATABASE_URI="file:/data/airtruct.sqlite?_foreign_keys=1&mode=rwc" \
  -e SECRET_KEY="this_is_a_32_byte_key_for_AES!!!" \
  -v airtruct-data:/data \
  ghcr.io/sananguliyev/airtruct -role worker -grpc-port 50001 \
  -coordinator-address airtruct-coordinator:50000
```

The coordinator will be available at `http://localhost:8080`.

See [Configuration](/docs/getting-started/configuration) for all environment variables including PostgreSQL and authentication.

## Verify Installation

```bash
airtruct --help
```

## Next Steps

- Follow the [Quickstart](/docs/getting-started/quickstart) to run your first pipeline.
- Review [Configuration](/docs/getting-started/configuration) for database and port options.
