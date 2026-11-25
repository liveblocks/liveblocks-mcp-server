<p align="center">
  <a href="https://liveblocks.io#gh-light-mode-only">
    <img src="https://raw.githubusercontent.com/liveblocks/liveblocks/main/.github/assets/header-light.svg" alt="Liveblocks" />
  </a>
  <a href="https://liveblocks.io#gh-dark-mode-only">
    <img src="https://raw.githubusercontent.com/liveblocks/liveblocks/main/.github/assets/header-dark.svg" alt="Liveblocks" />
  </a>
</p>

# `liveblocks-mcp-server`

This MCP server allows AI to use a number of functions from our [REST API](https://liveblocks.io/docs/api-reference/rest-api-endpoints). For example, it can create, modify, and delete different aspects of Liveblocks such as rooms, threads, comments, notifications, and more. It also has read access to Storage and Yjs. [Learn more in our docs](https://liveblocks.io/docs/tools/mcp-server).

## Hosted server

Add the following URL to an MCP client that supports remote servers and OAuth:

```text
https://mcp.liveblocks.io/mcp
```

When the client opens Liveblocks in your browser, choose the project it can access.
**Read only** is selected by default. If the client requests write access, you can
choose **Read and write**. Select **Allow access** to return to the client. You
can review the project and disconnect the app later in
[Connected apps](https://liveblocks.io/dashboard/settings/connected-apps).

### Cursor

Add this to `~/.cursor/mcp.json`, then select **Connect** in Cursor:

```json
{
  "mcpServers": {
    "liveblocks": {
      "url": "https://mcp.liveblocks.io/mcp"
    }
  }
}
```

### Claude Code

```bash
claude mcp add --transport http liveblocks https://mcp.liveblocks.io/mcp
```

Run `/mcp` in Claude Code, select `liveblocks`, and sign in.

### Claude Desktop

Open **Customize → Connectors → + Add → Add custom connector**. Name it
**Liveblocks**, enter `https://mcp.liveblocks.io/mcp`, and select **Connect**
on the new connector.

### Codex

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.liveblocks]
url = "https://mcp.liveblocks.io/mcp"
```

Run `codex mcp login liveblocks` in the terminal, or select **Authenticate** in
the Codex app.

### Use a project secret key

Existing clients can keep sending `Authorization: Bearer <secret-key>` to the
same URL. This also works for scripts that run without a browser. A project
secret key gives full access to that project. Use a development project's key
and keep it in user-local configuration. For example, in Codex, set
`bearer_token_env_var = "LIVEBLOCKS_SECRET_KEY"` under `[mcp_servers.liveblocks]`
and supply the key in that environment variable.

## Local server

To run this repository's server on your machine, use `npx` with your development
project's secret key from [your dashboard](https://liveblocks.io/dashboard).
Replace `sk_xxxxxxxxxxxx` in the examples below.

### Cursor

<details><summary>Read more</summary>

<p></p>

1. Go to File → Cursor Settings → MCP → Add new server.
2. Add the following, inserting your secret key:

```json
{
  "mcpServers": {
    "liveblocks": {
      "command": "npx",
      "args": ["-y", "github:liveblocks/liveblocks-mcp-server"],
      "env": {
        "LIVEBLOCKS_SECRET_KEY": "sk_xxxxxxxxxxxx"
      }
    }
  }
}
```

</details>

### Claude Code

<details><summary>Read more</summary>

<p></p>

Run the following command in the terminal, inserting your secret key:

```bash
claude mcp add liveblocks -e LIVEBLOCKS_SECRET_KEY=sk_xxxxxxxxxxxx -- npx -y github:liveblocks/liveblocks-mcp-server
```

</details>

### Claude Desktop

<details><summary>Read more</summary>

<p></p>

1. Go to Settings → Developer → Edit Config.

2. Open the JSON file, `claude_desktop_config.json`.

3. Add the following to the JSON, inserting your secret key:

```json
{
  "mcpServers": {
    "liveblocks": {
      "command": "npx",
      "args": ["-y", "github:liveblocks/liveblocks-mcp-server"],
      "env": {
        "LIVEBLOCKS_SECRET_KEY": "sk_xxxxxxxxxxxx"
      }
    }
  }
}
```

4. Restart Claude Desktop to apply the changes.

</details>

### Codex

<details><summary>Read more</summary>

<p></p>

1. Ensure the Codex CLI is installed:

```bash
npm i -g @openai/codex
```

2. Run the following command in the terminal, inserting your secret key:

```bash
codex mcp add liveblocks \
  --env LIVEBLOCKS_SECRET_KEY=sk_xxxxxxxxxxxx \
  -- npx -y github:liveblocks/liveblocks-mcp-server
```

</details>
