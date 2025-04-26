# Airtruct - Powerful ETL tool in a single file
> ETL Pipelines, Made Simple — scale as you need, without the hassle.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)]() [![Status](https://img.shields.io/badge/Status-Early%20Development-orange.svg)]() 

Airtruct is a modern, open-source data pipeline tool designed to be a powerful and efficient alternative to tools like Airbyte and Fivetran. It empowers data analysts and scientists to easily build and manage data streams with a user-friendly, DAG-style UI.

## Key Features

* **Visual DAG-style Stream Builder:** Intuitive UI to visually create and manage data pipelines using a Directed Acyclic Graph (DAG) interface.
* **Powerful In-Pipeline Transformations:** Utilize Bloblang, a lightweight, JSON-like DSL, for efficient data transformation and enrichment within the pipeline. Bloblang offers built-in mapping, filtering, and conditional logic, often replacing the need for separate transformation tools like dbt.
* **Flexible Subprocess Processor:** Integrate processors or enrichers developed in any programming language. Communication occurs via stdin/stdout, ensuring language-agnostic compatibility.
* **Native HTTP Input:** Accept data over HTTP, making it ideal for handling webhooks and streaming data sources. 
* **Horizontally Scalable Worker Pool Architecture:** Scale your data processing capabilities with a horizontally scalable worker pool. 
* **Delivery Guarantee:** Ensures reliable data delivery. 
* **Buffering and Caching:** Optimizes performance through buffering and caching mechanisms.
* **Robust Error Handling:** Provides comprehensive error handling capabilities.

## Why Airtruct?
*Comparison with Other ETL Tools*

| Feature                     | Airtruct                  | Airbyte                  | Fivetran               |
| :--------------------------- | :------------------------- | :----------------------- | :--------------------- |
| License                      | 🆓 Apache 2.0               | 🆓 OSS + Cloud (Mixed)    | 🔒 Proprietary SaaS     |
| Built-in Transform/Enrich    | ✅ Native (Bloblang DSL)     | ⚡ Requires dbt integration | ⚡ SQL-only             |
| Custom Components            | ✅ Any language (Subprocess) | ⚠️ Limited SDK (Python/Java) | ❌ Not Supported      |
| HTTP Input Source            | ✅ Native support           | ❌ Not available          | ❌ Not available        |
| Docker Dependency            | ✅ None (standalone)        | ⚠️ Required (Hard)         | ☁️ Managed Service Only |
| Connector Extensibility      | ✅ Easy (Go or Subprocess)   | ⚠️ Moderate (Connector SDK) | ❌ Closed ecosystem    |
| UI Stream Builder            | ✅ Full DAG-style UI         | ⚡ Basic UI               | ⚡ Form-based setup      |
| Monitoring & Observability   | ✅ Metrics, tracing, and logs | ⚡ Logs only              | ⚡ Logs & basic metrics  |
| Scalability                  | ✅ Lightweight and horizontal | ⚠️ Heavy (Docker/Postgres) | ☁️ Cloud-optimized     |

---

Airtruct provides a modern, lightweight, and open alternative to traditional ETL platforms.  
Unlike container-heavy or closed systems, Airtruct focuses on flexibility, performance, and developer freedom — allowing users to build powerful pipelines with minimal operational overhead.

Whether you need real-time webhook ingestion, easy custom processors in any language, or fine-grained observability — Airtruct is built to scale with you.

## Architecture

Airtruct employs a Coordinator & Worker model: 

* **Coordinator:** Handles pipeline orchestration and workload balancing across workers.
* **Workers:** Stateless processing units that auto-scale to meet processing demands.

This architecture is lightweight and modular, with no Docker dependency, enabling easy deployment on various platforms, including Kubernetes, bare-metal servers, and virtual machines.

```mermaid
graph TD;
    A[Coordinator] <--> B[Worker 1];
    A[Coordinator] <--> C[Worker 2];
    A[Coordinator] <--> D[Worker 3];
    A[Coordinator] <--> E[Worker ...];  

    %% Styling for clarity
    class A rectangle;
    class B,C,D,E rectangle;

```

## Performance & Scalability

Airtruct is designed for high performance and scalability:

* **Go-native:** Built as a single binary with no VM or container overhead, keeping things light and fast. 
* **Memory-safe and Low CPU Usage:** Engineered for efficient resource utilization. 
* **Smart Load Balancing:** Worker pool model with intelligent load balancing. 
* **Parallel Execution Control:** Fine-grained control over parallel processing threads. 
* **Real-time & Batch Friendly:** Supports both real-time and batch data processing. 

## Getting Started

Coming soon! In the meantime, clone the repo and stay tuned for setup instructions.  
*(Note: the repo is functional, but full documentation is coming soon!)*

## Documentation

Comprehensive documentation is currently in progress.  
Feel free to open [issues](https://github.com/sananguliyev/airtruct/issues) if you have specific questions!

## Contributing

We welcome contributions! Please check out [CONTRIBUTING](CONTRIBUTING) (coming soon) for guidelines.

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.
