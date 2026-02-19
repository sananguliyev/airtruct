---
sidebar_position: 1
---

# Installation

Airtruct runs as a single binary with no external dependencies. Choose the method that works best for you.

## Download Binary

1. Go to the [Releases page](https://github.com/sananguliyev/airtruct/releases).
2. Download the appropriate binary for your operating system (Linux, macOS, or Windows).
3. Make it executable (Linux/macOS):

```bash
chmod +x airtruct
```

On Windows, run the `.exe` file directly.

## Docker Compose

If you prefer Docker, use the included `docker-compose.yml`:

```bash
git clone https://github.com/sananguliyev/airtruct.git
cd airtruct
docker-compose up
```

The coordinator will be available at `http://localhost:8080`.

See [Configuration](/docs/getting-started/configuration) for PostgreSQL setup with Docker Compose.

## Verify Installation

```bash
./airtruct --help
```

## Next Steps

- Follow the [Quickstart](/docs/getting-started/quickstart) to run your first pipeline.
- Review [Configuration](/docs/getting-started/configuration) for database and port options.
