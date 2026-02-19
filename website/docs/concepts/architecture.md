---
sidebar_position: 1
---

# Architecture

Airtruct uses a **Coordinator & Worker** model designed for simplicity and horizontal scalability.

## Overview

```mermaid
graph TD
    C["Coordinator<br/>(HTTP + gRPC)"]
    C -- gRPC --> W1["Worker 1"]
    C -- gRPC --> W2["Worker 2"]
    C -- gRPC --> W3["Worker 3"]
    C -- gRPC --> W4["Worker ..."]
```

## Coordinator

The coordinator is the control plane. It:

- Serves the **web UI** and **REST API** on the HTTP port (default `8080`).
- Manages **stream definitions** — create, update, delete, start, stop.
- Handles **worker registration** and health tracking via gRPC.
- Balances **workload distribution** across available workers.
- Stores all state in the configured database (SQLite or PostgreSQL).

There is one coordinator per deployment.

## Workers

Workers are the data plane. They:

- **Register** with the coordinator on startup via gRPC.
- **Execute streams** — run the actual input, processing, and output pipelines.
- Are **stateless** — all configuration comes from the coordinator.
- Can be **added or removed** at any time for horizontal scaling.
- Send periodic **heartbeats** to the coordinator.

You can run as many workers as needed. Each worker handles one or more streams assigned by the coordinator.

## Communication

All communication between coordinator and workers uses **gRPC**. The coordinator exposes a REST/HTTP API (with gRPC-Gateway) for the web UI and external integrations.

## Deployment

Since Airtruct is a single binary, deployment is straightforward:

- **Single machine**: Run coordinator and worker(s) as separate processes with different gRPC ports.
- **Multiple machines**: Run the coordinator on one host and workers on others, pointing workers to the coordinator's address via `-discovery-uri`.
- **Kubernetes**: Deploy coordinator as a Deployment/Service and workers as a **StatefulSet**. StatefulSets give each worker pod a stable hostname (e.g., `airtruct-worker-0`, `airtruct-worker-1`), which prevents stale worker registrations that occur with Deployments where pods get random names on every restart.
- **Docker Compose**: Use the included `docker-compose.yml` for local development.

No Docker, JVM, or external dependencies are required.
