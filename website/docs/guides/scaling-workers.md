---
sidebar_position: 3
---

# Scaling Workers

Airtruct's worker pool architecture makes horizontal scaling straightforward. This guide covers how to add workers and distribute workload.

## Adding Workers

Each worker is an independent process that registers with the coordinator. To add a worker:

```bash
./airtruct -role worker -grpc-port 50002 -discovery-uri localhost:50000
```

- Use a unique `-grpc-port` for each worker on the same host.
- Set `-discovery-uri` to the coordinator's gRPC address (default `localhost:50000`).

Workers automatically register on startup and begin accepting stream assignments.

## Multi-Host Deployment

Run workers on separate machines by pointing them to the coordinator's address:

```bash
# On machine B
./airtruct -role worker -grpc-port 50001 -discovery-uri coordinator-host:50000
```

The coordinator tracks all workers and distributes streams across them.

## Worker Health

Workers send periodic heartbeats to the coordinator. If a worker stops sending heartbeats, the coordinator marks it as unhealthy and can reassign its streams.

## Scaling Strategies

### Vertical Scaling

Increase the resources (CPU, memory) of individual worker machines. Airtruct is Go-native and efficient with resources.

### Horizontal Scaling

Add more worker processes. This is the recommended approach for handling increased workload:

- Each worker can run multiple streams.
- The coordinator balances stream assignments across available workers.
- Workers can be added or removed without downtime.

### Kubernetes

Deploy workers as a **StatefulSet** rather than a Deployment. StatefulSets give each pod a stable, predictable hostname (e.g., `airtruct-worker-0`, `airtruct-worker-1`). With a Deployment, pods get random names on every restart, which causes stale worker registrations to pile up in the coordinator.

```bash
kubectl scale statefulset airtruct-worker --replicas=5
```

Each pod registers as an independent worker with the coordinator using its stable hostname.
