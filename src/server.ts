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

const RoomPermission = z.union([
  z.tuple([z.literal("room:write")]),
  z.tuple([z.literal("room:read"), z.literal("room:presence:write")]),
]);

const RoomPermissionWithEmpty = z.union([
  z.tuple([z.literal("room:write")]),
  z.tuple([z.literal("room:read"), z.literal("room:presence:write")]),
  z.tuple([]),
]);

server.tool(
  "liveblocks-create-room",
  "Create a Liveblocks room",
  {
    roomId: z.string(),
    defaultAccesses: RoomPermissionWithEmpty,
    groupsAccesses: z.record(z.string(), RoomPermission),
    usersAccesses: z.record(z.string(), RoomPermission),
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
  "liveblocks-get-rooms",
  "Get recent Liveblocks rooms",
  {
    limit: z.number(),
  },
  async ({ limit }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getRooms({ limit }, { signal: extra.signal })
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
