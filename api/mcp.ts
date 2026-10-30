import type { IncomingMessage, ServerResponse } from "node:http";
import { handleMcpRequest } from "../src/http.js";

/**
 * Vercel serverless function serving the MCP endpoint.
 *
 * Vercel parses JSON request bodies before invoking the handler, so the parsed
 * body is forwarded to the transport instead of re-reading the stream.
 */
export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  await handleMcpRequest(req, res, req.body);
}
