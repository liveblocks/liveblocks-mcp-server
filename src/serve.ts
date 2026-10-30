#!/usr/bin/env node
import { createServer as createHttpServer } from "node:http";
import { handleMcpRequest } from "./http.js";

/**
 * Standalone HTTP entry point, useful for local development and for hosting
 * the server somewhere other than Vercel. Serves the MCP endpoint at `/mcp`.
 */
const port = Number(process.env.PORT) || 3000;

const httpServer = createHttpServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/mcp" || url.pathname === "/api/mcp") {
    await handleMcpRequest(req, res);
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
