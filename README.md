<p align="center">
  <a href="https://liveblocks.io#gh-light-mode-only">
    <img src="https://raw.githubusercontent.com/liveblocks/liveblocks/main/.github/assets/header-light.svg" alt="Liveblocks" />
  </a>
  <a href="https://liveblocks.io#gh-dark-mode-only">
    <img src="https://raw.githubusercontent.com/liveblocks/liveblocks/main/.github/assets/header-dark.svg" alt="Liveblocks" />
  </a>
</p>

# `liveblocks-mcp-server`

[![smithery badge](https://smithery.ai/badge/@liveblocks/liveblocks-mcp-server)](https://smithery.ai/server/@liveblocks/liveblocks-mcp-server)

This MCP server allows AI to use a number of functions from our [REST API](https://liveblocks.io/docs/api-reference/rest-api-endpoints). For example, it can create, modify, and delete different aspects of Liveblocks such as rooms, threads, comments, notifications, and more. It also has read access to Storage and Yjs. [Learn more in our docs](https://liveblocks.io/docs/tools/mcp-server).

## Automatic setup

To install automatically, copy your Liveblocks secret key from a project in [your dashboard](https://liveblocks.io/dashboard) and run one of the following commands, replacing `[key]` with your secret key.

### Cursor

```bash
npx -y @smithery/cli install @liveblocks/liveblocks-mcp-server --client cursor --key [key]
```

### Claude Desktop

```bash
npx -y @smithery/cli install @liveblocks/liveblocks-mcp-server --client claude --key [key]
```

### VS Code

```bash
npx -y @smithery/cli install @liveblocks/liveblocks-mcp-server --client vscode --key [key]
```

### Other clients

Find installation information for other clients on [Smithery](https://smithery.ai/server/@liveblocks/liveblocks-mcp-server).

## Manual setup

<details><summary>Read more</summary>

<p></p>

1. Clone this repo.

```bash
git clone https://github.com/liveblocks/liveblocks-mcp-server.git
```

2. Build the project.

```bash
npm install
npm run build
```

3. Get your Liveblocks secret key from the [dashboard](https://liveblocks.io/dashboard).

```
sk_dev_Ns35f5G...
```

### Cursor

4. Go to File → Cursor Settings → MCP → Add new server.

5. Add the following, with the full path to the repo and your secret key:

```json
{
  "mcpServers": {
    "liveblocks-mcp-server": {
      "command": "node",
      "args": ["/full/path/to/the/repo/liveblocks-mcp-server/build/index.js"],
      "env": {
        "LIVEBLOCKS_SECRET_KEY": "sk_dev_Ns35f5G..."
      }
    }
  }
}
```

6. Check it's enabled in the MCP menu.

### Claude Desktop

4. Go to File → Settings → Developer → Edit Config.

5. Open the JSON file, `claude_desktop_config.json`.

6. Add the following, with the full path to the repo and your secret key:

```json
{
  "mcpServers": {
    "liveblocks-mcp-server": {
      "command": "node",
      "args": ["/full/path/to/the/repo/liveblocks-mcp-server/build/index.js"],
      "env": {
        "LIVEBLOCKS_SECRET_KEY": "sk_dev_Ns35f5G..."
      }
    }
  }
}
```

</details>
