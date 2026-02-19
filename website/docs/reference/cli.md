---
sidebar_position: 1
---

# CLI Reference

Airtruct is configured and launched via command-line flags. All flags can also be set via environment variables.

## Usage

```bash
./airtruct [flags]
```

## Flags

| Flag | Short | Type | Default | Env Variable | Description |
|------|-------|------|---------|-------------|-------------|
| `--role` | `-r` | string | `coordinator` | `ROLE` | Node role: `coordinator` or `worker` |
| `--grpc-port` | `-gp` | uint | — | `GRPC_PORT` | gRPC port (required) |
| `--http-port` | `-hp` | uint | `8080` | `HTTP_PORT` | HTTP port for UI and REST API |
| `--discovery-uri` | `-du` | string | `localhost:50000` | `DISCOVERY_URI` | Coordinator address for worker discovery |
| `--config` | `-c` | string | — | — | Path to YAML configuration file |
| `--debug` | `-d` | bool | `false` | `DEBUG_MODE` | Enable debug logging |

## Examples

### Start coordinator

```bash
./airtruct -role coordinator -grpc-port 50000
```

### Start coordinator on custom HTTP port

```bash
./airtruct -role coordinator -grpc-port 50000 -http-port 3000
```

### Start worker

```bash
./airtruct -role worker -grpc-port 50001
```

### Start worker connecting to remote coordinator

```bash
./airtruct -role worker -grpc-port 50001 -discovery-uri coordinator.example.com:50000
```

### Load configuration from file

```bash
./airtruct -config config.yaml -role coordinator -grpc-port 50000
```

### Enable debug logging

```bash
./airtruct -role coordinator -grpc-port 50000 --debug
```
