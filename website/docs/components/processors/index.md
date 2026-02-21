---
sidebar_position: 2
---

# Processors

Processors transform, validate, or route messages within a pipeline. They are applied in order between the input and output. Add processors when creating or editing a stream in the UI.

| Component | Description |
|-----------|-------------|
| [Mapping](/docs/components/processors/mapping) | Bloblang transformations |
| [JSON Schema](/docs/components/processors/json-schema) | Validates messages against a JSON schema |
| [Catch](/docs/components/processors/catch) | Error handling — runs processors on failure |
| [Switch](/docs/components/processors/switch) | Conditional processing based on message content |
| [Schema Registry Decode](/docs/components/processors/schema-registry-decode) | Decodes Avro messages via Schema Registry |
