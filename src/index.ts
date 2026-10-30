#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secretKey) {
    console.error(
      "Warning: LIVEBLOCKS_SECRET_KEY is not set. Tool calls will fail until it is provided."
    );
  }

  const server = createServer(secretKey);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Liveblocks MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
