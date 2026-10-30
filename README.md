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

The server can be used in two ways:

- **Hosted** – a remote server using the MCP Streamable HTTP transport. Nothing to install; you authenticate with your secret key. [Jump to setup](#hosted-server).
- **Local** – runs on your machine over stdio via `npx`. [Jump to setup](#local-server).

In both cases you need a Liveblocks secret key from a project in [your dashboard](https://liveblocks.io/dashboard). Replace `sk_xxxxxxxxxxxx` with your secret key in the examples below.

## Hosted server

The hosted server is served at `https://your-deployment.vercel.app/mcp` (replace with the URL of your deployment), and expects your secret key as a bearer token in the `Authorization` header.

### Cursor

<details><summary>Read more</summary>

<p></p>

1. Go to File → Cursor Settings → MCP → Add new server.
2. Add the following, inserting your secret key:

```json
{
  "mcpServers": {
    "liveblocks": {
      "url": "https://your-deployment.vercel.app/mcp",
      "headers": {
        "Authorization": "Bearer sk_xxxxxxxxxxxx"
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
claude mcp add --transport http liveblocks https://your-deployment.vercel.app/mcp \
  --header "Authorization: Bearer sk_xxxxxxxxxxxx"
```

</details>

### Claude Desktop

<details><summary>Read more</summary>

<p></p>

Claude Desktop can't send custom headers to remote servers yet, so connect through [`mcp-remote`](https://www.npmjs.com/package/mcp-remote):

1. Go to Settings → Developer → Edit Config.

2. Open the JSON file, `claude_desktop_config.json`.

3. Add the following to the JSON, inserting your secret key:

```json
{
  "mcpServers": {
    "liveblocks": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-deployment.vercel.app/mcp",
        "--header",
        "Authorization: Bearer sk_xxxxxxxxxxxx"
      ]
    }
  }
}
```

4. Restart Claude Desktop to apply the changes.

</details>

### Codex

<details><summary>Read more</summary>

<p></p>

Add the following to `~/.codex/config.toml`, and export `LIVEBLOCKS_SECRET_KEY` in your shell:

```toml
[mcp_servers.liveblocks]
url = "https://your-deployment.vercel.app/mcp"
bearer_token_env_var = "LIVEBLOCKS_SECRET_KEY"
```

</details>

### Deploying your own

The repository is ready to deploy to [Vercel](https://vercel.com) as-is: import it, and the `api/mcp.ts` function is exposed at `/mcp`. No environment variables are required. Every request must carry its own secret key in the `Authorization` header; the hosted server never reads a key from its own environment, so requests without one are rejected with `401`.

To run the HTTP server outside Vercel (for example locally), build it and start it with `npm run start:http`. It listens on `PORT` (default `3000`) and serves the endpoint at `/mcp`.

## Local server

Install by running one of the following commands, replacing `sk_xxxxxxxxxxxx` with your secret key.

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
