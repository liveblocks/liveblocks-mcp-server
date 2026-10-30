import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

/**
 * Reads the caller's Liveblocks secret key from the `Authorization: Bearer`
 * header.
 *
 * The HTTP server is multi-tenant, so the key must always come from the
 * request. It deliberately never falls back to the server's own environment:
 * a stray `LIVEBLOCKS_SECRET_KEY` on the deployment would otherwise let
 * unauthenticated requests act on that account.
 */
function getSecretKey(req: IncomingMessage): string | undefined {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return undefined;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match ? match[1].trim() : undefined;
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  res.writeHead(status, {
    ...CORS_HEADERS,
    ...headers,
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
}

function waitForResponseEnd(res: ServerResponse): Promise<void> {
  if (res.writableFinished || res.destroyed) {
    return Promise.resolve();
  }
  return new Promise((resolve) => res.once("close", () => resolve()));
}

/**
 * Handles a single MCP Streamable HTTP request.
 *
 * The server runs in stateless mode: every request gets its own `McpServer`
 * bound to the caller's secret key, and no session state is kept between
 * requests. This makes it a good fit for serverless hosts such as Vercel,
 * where consecutive requests may land on different instances.
 *
 * @param parsedBody Pass the already-parsed JSON body when the host has
 * consumed the request stream (e.g. Vercel's `req.body`).
 */
export async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  parsedBody?: unknown
): Promise<void> {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // Stateless servers have no sessions to terminate and nothing to push over a
  // standalone SSE stream. Answering 405 here keeps a GET from holding a
  // serverless function open for the full duration of its timeout.
  if (req.method !== "POST") {
    sendJson(
      res,
      405,
      {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed" },
        id: null,
      },
      { Allow: "POST, OPTIONS" }
    );
    return;
  }

  const secretKey = getSecretKey(req);

  if (!secretKey) {
    sendJson(
      res,
      401,
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message:
            "Unauthorized: provide your Liveblocks secret key in an `Authorization: Bearer sk_...` header",
        },
        id: null,
      },
      { "WWW-Authenticate": 'Bearer realm="liveblocks-mcp-server"' }
    );
    return;
  }

  if (!secretKey.startsWith("sk_")) {
    sendJson(
      res,
      401,
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message:
            "Unauthorized: the provided key is not a Liveblocks secret key (expected it to start with `sk_`)",
        },
        id: null,
      },
      { "WWW-Authenticate": 'Bearer realm="liveblocks-mcp-server"' }
    );
    return;
  }

  for (const [name, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(name, value);
  }

  const server = createServer(secretKey);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.once("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
    await waitForResponseEnd(res);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
}
