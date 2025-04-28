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

// Zod does not support tuple or literal here

// === Rooms ========================================================

server.tool(
  "liveblocks-get-rooms",
  `Get recent Liveblocks rooms`,
  {
    limit: z.number().lte(100),
    userId: z.string().optional(),
    groupIds: z.array(z.string()).optional(),
    startingAfter: z.string().optional(),
    query: z
      .object({
        roomId: z
          .object({
            startsWith: z.string(),
          })
          .optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
      .optional(),
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

// TODO make better
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

server.tool(
  "liveblocks-delete-room",
  "Delete a Liveblocks room",
  {
    roomId: z.string(),
  },
  async ({ roomId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.deleteRoom(roomId, { signal: extra.signal })
    );
  }
);

server.tool(
  "liveblocks-update-room-id",
  "Update a Liveblocks room's ID",
  {
    roomId: z.string(),
    newRoomId: z.string(),
  },
  async ({ roomId, newRoomId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.updateRoomId(
        { currentRoomId: roomId, newRoomId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-get-active-users",
  "Get a Liveblocks room's active users",
  {
    roomId: z.string(),
  },
  async ({ roomId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getActiveUsers(roomId, { signal: extra.signal })
    );
  }
);

server.tool(
  "liveblocks-broadcast-event",
  "Broadcast an event to a Liveblocks room",
  {
    roomId: z.string(),
    event: z.record(z.string(), z.any()),
  },
  async ({ roomId, event }, extra) => {
    return await callLiveblocksApi(
      liveblocks.broadcastEvent(roomId, event, { signal: extra.signal })
    );
  }
);

// === Storage ======================================================

server.tool(
  "liveblocks-get-storage-document",
  "Get a Liveblocks storage document",
  {
    roomId: z.string(),
  },
  async ({ roomId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getStorageDocument(roomId, "json", { signal: extra.signal })
    );
  }
);

// === Yjs ==========================================================

server.tool(
  "liveblocks-get-yjs-document",
  "Get a Liveblocks Yjs text document",
  {
    roomId: z.string(),
    options: z
      .object({
        format: z.boolean().optional(),
        key: z.string().optional(),
        type: z.string().optional(),
      })
      .optional(),
  },
  async ({ roomId, options }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getYjsDocument(roomId, options, { signal: extra.signal })
    );
  }
);

// === Comments =====================================================

// === Notifications ================================================
