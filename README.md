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

The quickest way to connect is the hosted server: add its URL in your MCP client and sign in with your Liveblocks account when prompted.

- **[Hosted server](#hosted-server)** – connect to `https://mcp.liveblocks.io/mcp` and sign in with your Liveblocks account. Nothing to install.
- **[Authenticating with a secret key](#authenticating-with-a-secret-key)** – use a secret key as a bearer token instead of signing in, e.g. for production projects or headless use.
- **[Local server](#local-server)** – run on your machine with `npx`.

## Hosted server

Add `https://mcp.liveblocks.io/mcp` to your client. On first use, your client opens liveblocks.io in your browser where you sign in and choose which development project to connect. Only development projects can be connected this way; for a production project, use a [secret key](#authenticating-with-a-secret-key) instead.

### Cursor

<details><summary>Read more</summary>

<p></p>

1. Go to File → Cursor Settings → MCP → Add new server.
2. Add the following:

```json
{
  "mcpServers": {
    "liveblocks": {
      "url": "https://mcp.liveblocks.io/mcp"
    }
  }
}
```

3. Click **Connect** next to the server and sign in with your Liveblocks account.

</details>

### Codex

<details><summary>Read more</summary>

<p></p>

Run in the terminal:

```bash
codex mcp add liveblocks --url https://mcp.liveblocks.io/mcp
codex mcp login liveblocks
```

The second command opens your browser to sign in.

</details>

### Claude Code

<details><summary>Read more</summary>

<p></p>

```bash
claude mcp add --transport http liveblocks https://mcp.liveblocks.io/mcp
```

Then run `/mcp` inside Claude Code and choose **Authenticate** for `liveblocks` to sign in.

</details>

### Claude Desktop

<details><summary>Read more</summary>

<p></p>

Go to Settings → Connectors → Add custom connector, enter `https://mcp.liveblocks.io/mcp`, then click Connect and sign in.

</details>

## Authenticating with a secret key

If you'd rather not sign in, or you need to connect a **production** project, you can pass a secret key from a project in [your dashboard](https://liveblocks.io/dashboard) as a bearer token. Replace `sk_xxxxxxxxxxxx` with it in the examples below. The key gives full access to the project, so keep it out of shared config.

### Cursor

<details><summary>Read more</summary>

<p></p>

1. Go to File → Cursor Settings → MCP → Add new server.
2. Add the following, inserting your secret key:

```json
{
  "mcpServers": {
    "liveblocks": {
      "url": "https://mcp.liveblocks.io/mcp",
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
claude mcp add --transport http liveblocks https://mcp.liveblocks.io/mcp \
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
        "https://mcp.liveblocks.io/mcp",
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
url = "https://mcp.liveblocks.io/mcp"
bearer_token_env_var = "LIVEBLOCKS_SECRET_KEY"
```

</details>

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

## Hosting the HTTP server

The HTTP server (`npm run start:http`, or the Vercel functions in `api/`) accepts secret keys as bearer tokens out of the box. To also accept OAuth sign-in, it needs the shared token secret from liveblocks.io.

| Variable | Required | Description |
| --- | --- | --- |
| `MCP_OAUTH_TOKEN_SECRET` | For OAuth | Secret shared with liveblocks.io, used to decrypt the access tokens it issues. When unset, OAuth is disabled and only secret keys are accepted. |
| `MCP_PUBLIC_URL` | No | Public origin of this server, used as the OAuth resource identifier and required as the access token's `aud`. Must match the origin clients connect to and be allowlisted on the authorization server (so preview deployments need their own value). Defaults to `https://mcp.liveblocks.io`. |
| `MCP_OAUTH_ISSUER` | No | Origin of the authorization server that issues tokens; must equal the token's `iss`. Defaults to `https://liveblocks.io`. |
| `LIVEBLOCKS_BASE_URL` | No | Overrides the Liveblocks API host the server talks to, e.g. a dev backend for preview deployments (`NEXT_PUBLIC_LIVEBLOCKS_BASE_URL` is accepted as a fallback). Leave unset in production to use the default API. |
| `PORT` | No | Port for `npm run start:http`. Defaults to `3000`. |

When OAuth is enabled, the server advertises it at `/.well-known/oauth-protected-resource`, which MCP clients use to discover the sign-in flow.
