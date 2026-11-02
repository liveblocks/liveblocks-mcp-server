#!/usr/bin/env node
import { createServer as createHttpServer } from "node:http";
import {
  handleMcpRequest,
  handleProtectedResourceMetadataRequest,
} from "./http.js";
import { PROTECTED_RESOURCE_METADATA_PATH } from "./oauth.js";

/**
 * Standalone HTTP entry point, useful for local development and for hosting
 * the server somewhere other than Vercel. Serves the MCP endpoint at `/mcp`
 * and the OAuth protected resource metadata at
 * `/.well-known/oauth-protected-resource`.
 */
const port = Number(process.env.PORT) || 3000;

const httpServer = createHttpServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/mcp" || url.pathname === "/api/mcp") {
    await handleMcpRequest(req, res);
    return;
  }

  // Some clients request the path-suffixed variant for a resource at `/mcp`
  // (RFC 9728 §3.1), so both forms serve the same document.
  if (
    url.pathname === PROTECTED_RESOURCE_METADATA_PATH ||
    url.pathname === `${PROTECTED_RESOURCE_METADATA_PATH}/mcp`
  ) {
    handleProtectedResourceMetadataRequest(req, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found. The MCP endpoint is served at /mcp");
});

httpServer.listen(port, () => {
  console.error(
    `Liveblocks MCP Server listening on http://localhost:${port}/mcp`
  );
});
