# MCP Tool

Exposes a stream as a tool via the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP). AI assistants like Claude Desktop, Claude Code, Cursor, and other MCP-compatible clients can discover and call your stream as a tool.

The coordinator exposes a single MCP endpoint at `/mcp` using the Streamable HTTP transport. All MCP Tool streams are registered as tools on this endpoint and automatically synced every 5 seconds.

| Field | Type | Description |
|-------|------|-------------|
| Name | string | Tool name that AI clients see (required) |
| Description | string | Human-readable description of what the tool does (required) |
| Input Parameters | property list | Parameters the tool accepts — each with a name, type, description, and required flag (required) |

The output **must** be [Sync Response](/docs/components/outputs/sync-response) — this is enforced automatically in the UI. The processed message is returned as the tool result to the AI client.

## Error Handling

By default, successful tool executions return with a 200 status code. To signal errors or different HTTP status codes (like 404 for "not found" or 400 for "bad request"), set the `meta status_code` field in your stream:

```yaml
meta status_code = 404
```

This is useful when you want to return semantic error codes to the AI client, such as:
- `404` when a requested resource (user, document, etc.) is not found
- `400` for invalid input parameters
- `403` for permission denied
- `500` for internal errors

The AI client will receive both the status code and your response message, allowing it to handle different error conditions appropriately.

:::tip
Write clear, specific descriptions for both the tool and its parameters. AI assistants use these descriptions to decide when and how to call your tool.
:::
