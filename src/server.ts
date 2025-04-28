import { z } from "zod";
import { callLiveblocksApi } from "./utils.js";
import { Liveblocks } from "@liveblocks/node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export const server = new McpServer({
  name: "liveblocks-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

/*
 Zod does not support tuple or literal here
 Realistic APIs we could support
 getRooms no args

*/

server.tool(
  "liveblocks-get-rooms",
  "Get recent Liveblocks rooms",
  {
    limit: z.number().optional(),
    userId: z.string().optional(),
    groupIds: z.array(z.string()).optional(),
    startingAfter: z.string().optional(),
  },
  async ({ limit, userId, groupIds, startingAfter }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getRooms(
        { limit, userId, groupIds, startingAfter },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-create-room",
  "Create a Liveblocks room",
  {
    roomId: z.string(),
    metadata: z.record(z.string(), z.string()).optional(),
  },
  async ({ roomId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.createRoom(
        roomId,
        { defaultAccesses: ["room:write"] },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-get-room",
  "Get a Liveblocks room",
  {
    roomId: z.string(),
  },
  async ({ roomId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getRoom(roomId, { signal: extra.signal })
    );
  }
);
