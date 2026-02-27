---
sidebar_position: 5
---

# MCP Tool Integration

This guide shows how to expose Airtruct streams as tools that AI assistants can discover and call via the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP).

## How It Works

The Airtruct coordinator exposes a single MCP endpoint at `/mcp` using the Streamable HTTP transport. When you create a stream with the **MCP Tool** input, it becomes a tool that any MCP-compatible client can call. The tool call flows through your stream's processors and returns the result via Sync Response.

## Create an MCP Tool

Open the Airtruct UI, click **Create New Stream**, and configure each section:

### Input — select **MCP Tool**

| Field | Value |
|-------|-------|
| Name | `get_weather` |
| Description | `Get current weather for a city` |
| Input Parameters | `city` (string, required) — "City name" |

### Processor — select **Mapping**

For this example, we return a random temperature. In practice, you would call an external API using or use other processors.

| Field | Value |
|-------|-------|
| Mapping | `root.temperature = random_int(min:0, max:40).string() + "°C"` / `root.city = this.city` |

### Output

The output is automatically set to **Sync Response** and locked when using MCP Tool input.

Click **Save** and then **Start** the stream.

## Connect AI Clients

The MCP endpoint is available at `http://<coordinator-host>:<port>/mcp`. The examples below assume the coordinator is running on `localhost:8080`.

### Claude Code

Add directly via the CLI:

```bash
claude mcp add airtruct -- npx mcp-remote http://localhost:8080/mcp
```

Or add to your claude settings

```json
{
  "mcpServers": {
    "airtruct": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8080/mcp"]
    }
  }
}
```

Restart Claude Code after adding the configuration.

### Claude Desktop

Add the server in **Settings > Connectors** with the MCP endpoint URL, or add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "airtruct": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8080/mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "airtruct": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8080/mcp"]
    }
  }
}
```

### Other MCP Clients

Any client that supports the Streamable HTTP transport can connect directly to `http://localhost:8080/mcp`. For clients that only support stdio transport, use [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) as a bridge as shown in the examples above.

## Verify with curl

You can test the MCP endpoint directly:

```bash
# Initialize a session
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# List available tools
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: <session-id-from-init-response>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Call a tool
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: <session-id-from-init-response>" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_weather","arguments":{"city":"London"}}}'
```

## Multiple Tools

Each MCP Tool stream becomes a separate tool. Create as many streams as you need — they all appear under the same `/mcp` endpoint. Tools are synced automatically when streams are started or stopped.
