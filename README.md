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

## Setup

To install, copy your Liveblocks secret key from a project in [your dashboard](https://liveblocks.io/dashboard) and run one of the following commands, replacing `sk_xxxxxxxxxxxxxxxx` with your secret key.

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
        "LIVEBLOCKS_SECRET_KEY": "sk_xxxxxxxxxxxxxxxx"
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
claude mcp add liveblocks -e LIVEBLOCKS_SECRET_KEY=sk_xxxxxxxxxxxxxxxx -- npx -y github:liveblocks/liveblocks-mcp-server
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
        "LIVEBLOCKS_SECRET_KEY": "sk_xxxxxxxxxxxxxxxx"
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
  --env LIVEBLOCKS_SECRET_KEY=sk_xxxxxxxxxxxxxxxx \
  -- npx -y github:liveblocks/liveblocks-mcp-server
```

</details>
