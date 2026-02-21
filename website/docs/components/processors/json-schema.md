# JSON Schema

Validates messages against a JSON Schema. Messages that fail validation are rejected.

| Field | Type | Description |
|-------|------|-------------|
| Schema | string | The JSON Schema to validate against (required) |

Paste the full JSON Schema into the Schema field. For example, to require `id` and `email` fields, use a schema with `"required": ["id", "email"]` and define the property types.
