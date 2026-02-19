---
sidebar_position: 2
---

# Processors

Processors transform, validate, or route messages within a pipeline. They are applied in order between the input and output. Add processors when creating or editing a stream in the UI.

## Mapping

Applies [Bloblang](https://www.benthos.dev/docs/guides/bloblang/about) transformations to messages. This is the most commonly used processor.

| Field | Type | Description |
|-------|------|-------------|
| Mapping | Bloblang | The Bloblang mapping to apply (required) |

Common patterns:

- **Rename and transform fields** — `root.full_name = this.first_name + " " + this.last_name`
- **Convert values** — `root.email = this.email.lowercase()`
- **Add timestamps** — `root.created_at = now()`
- **Filter messages** — `root = if this.status == "active" { this } else { deleted() }`

---

## JSON Schema

Validates messages against a JSON Schema. Messages that fail validation are rejected.

| Field | Type | Description |
|-------|------|-------------|
| Schema | string | The JSON Schema to validate against (required) |

Paste the full JSON Schema into the Schema field. For example, to require `id` and `email` fields, use a schema with `"required": ["id", "email"]` and define the property types.

---

## Catch

Error handling processor. Applies a list of processors when a previous processing step fails.

| Field | Type | Description |
|-------|------|-------------|
| Processors | array | Processors to apply on error |

Add child processors inside Catch that run when upstream processing fails. Commonly used with a Mapping processor to capture the error message via `error()` and the raw content via `content()`.

---

## Switch

Conditional processing — routes messages to different processors based on conditions.

| Field | Type | Description |
|-------|------|-------------|
| Cases | array | List of condition/processor pairs |

Each case has:
- **Check** — A Bloblang condition (e.g., `this.type == "order"`).
- **Processors** — Processors to apply when the condition is true.

Add multiple cases in the UI. Messages are evaluated against each case in order.

---

## Schema Registry Decode

Decodes Avro-encoded messages using a Confluent Schema Registry.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| URL | string | — | Schema Registry URL (required) |
| Avro Raw JSON | boolean | `false` | Output raw JSON instead of Avro logical types |

Supports authentication: **Basic Auth**, **OAuth**, and **JWT**.

:::tip
This processor is commonly paired with the [Kafka](/docs/components/inputs#kafka) input for Avro-encoded topic consumption. See the [Kafka to PostgreSQL](/docs/guides/kafka-to-postgresql) guide for a complete example.
:::
