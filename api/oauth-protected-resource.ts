import type { IncomingMessage, ServerResponse } from "node:http";
import { handleProtectedResourceMetadataRequest } from "../src/http.js";

/**
 * Vercel serverless function serving the OAuth protected resource metadata
 * (RFC 9728). `vercel.json` rewrites both
 * `/.well-known/oauth-protected-resource` and
 * `/.well-known/oauth-protected-resource/mcp` here.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  handleProtectedResourceMetadataRequest(req, res);
}
