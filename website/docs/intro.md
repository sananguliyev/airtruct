---
sidebar_position: 1
slug: /
---

# Introduction

Airtruct is a modern, open-source data pipeline tool designed to be a powerful and efficient alternative to tools like Airbyte and Fivetran. It empowers data analysts and scientists to easily build and manage data streams with a user-friendly, DAG-style UI.

At its core, Airtruct uses [Bento](https://warpstreamlabs.github.io/bento/) as the stream processing engine. Bento provides battle-tested connectors, at-least-once delivery guarantees, and a rich set of processors — all driven by Airtruct's coordinator-worker architecture and managed through the UI without writing any configuration by hand.

## Key Features

- **Visual DAG-style Stream Builder** — Intuitive UI to visually create and manage data pipelines using a Directed Acyclic Graph interface.
- **Powerful In-Pipeline Transformations** — Bloblang DSL for efficient data transformation and enrichment within the pipeline, replacing the need for separate tools like dbt.
- **Flexible Subprocess Processor** — Integrate processors written in any programming language. Communication via stdin/stdout ensures language-agnostic compatibility.
- **Native HTTP Input** — Accept data over HTTP, ideal for webhooks and streaming data sources.
- **Horizontally Scalable Worker Pool** — Scale your data processing with a horizontally scalable worker pool architecture.
- **Delivery Guarantees** — Reliable data delivery with buffering, caching, and robust error handling.

## Why Airtruct?

- **Completely free** — Apache 2.0 license with no usage limits or paid tiers.
- **Zero operational overhead** — Runs as a single lightweight binary with no Docker, JVM, or external dependencies required.
- **Native transformations** — The built-in Bloblang DSL handles mapping, filtering, and conditional logic, eliminating the need for separate tools like dbt.
- **Language-agnostic processors** — Write custom processors in any language through simple stdin/stdout communication.
- **Built-in observability** — Metrics, tracing, and logs out of the box.
- **High performance** — Written in Go with low memory and CPU footprint. Supports both real-time and batch workloads with fine-grained parallel execution control.

## Who is Airtruct for?

- **Data Engineers** who want a lightweight, self-hosted ETL tool without Docker overhead.
- **Backend Developers** who need to move data between systems with transformations.
- **Small Teams** that want powerful data pipelines without enterprise complexity or cost.

## Next Steps

- [Install Airtruct](/docs/getting-started/installation) and get running in minutes.
- Follow the [Quickstart](/docs/getting-started/quickstart) to build your first pipeline.
- Learn about the [Architecture](/docs/concepts/architecture) behind Airtruct.
