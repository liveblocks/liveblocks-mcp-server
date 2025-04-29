import { z } from "zod";
import { callLiveblocksApi } from "./utils.js";
import { Liveblocks } from "@liveblocks/node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CommentBody, ThreadMetadata } from "./zod.js";

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

// Note: `tuple` and `literal` Zod types cause issues with the MCP server

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
  async ({ limit, userId, groupIds, startingAfter, query }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getRooms(
        { limit, userId, groupIds, startingAfter, query },
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

server.tool(
  "liveblocks-get-threads",
  `Get recent Liveblocks threads`,
  {
    roomId: z.string(),
    query: z
      .object({
        resolved: z.boolean().optional(),
        metadata: z
          .record(
            z.string(),
            z.union([
              z.string(),
              z.object({
                startsWith: z.string(),
              }),
            ])
          )
          .optional(),
      })
      .optional(),
  },
  async ({ roomId, query }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getThreads({ roomId, query }, { signal: extra.signal })
    );
  }
);

server.tool(
  "liveblocks-create-thread",
  `Create a Liveblocks thread. Always ask for a userId.`,
  {
    roomId: z.string(),
    data: z.object({
      comment: z.object({
        body: CommentBody,
        userId: z.string(),
        createdAt: z.date().optional(),
      }),
      metadata: z
        .record(z.string(), z.union([z.string(), z.boolean(), z.number()]))
        .optional(),
    }),
  },
  async ({ roomId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.createThread({ roomId, data }, { signal: extra.signal })
    );
  }
);

server.tool(
  "liveblocks-get-thread",
  "Get a Liveblocks thread",
  {
    roomId: z.string(),
    threadId: z.string(),
  },
  async ({ roomId, threadId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getThread({ roomId, threadId }, { signal: extra.signal })
    );
  }
);

server.tool(
  "liveblocks-get-thread-participants",
  "Get a Liveblocks thread's participants",
  {
    roomId: z.string(),
    threadId: z.string(),
  },
  async ({ roomId, threadId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getThreadParticipants(
        { roomId, threadId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-edit-thread-metadata",
  `Edit a Liveblocks thread's metadata. \`null\` can be used to remove a key.`,
  {
    roomId: z.string(),
    threadId: z.string(),
    data: z.object({
      metadata: z.record(
        z.string(),
        z.union([z.string(), z.boolean(), z.number(), z.null()])
      ),
      userId: z.string(),
      updatedAt: z.date().optional(),
    }),
  },
  async ({ roomId, threadId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.editThreadMetadata(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-mark-thread-as-resolved",
  "Mark a Liveblocks thread as resolved",
  {
    roomId: z.string(),
    threadId: z.string(),
    data: z.object({
      userId: z.string(),
    }),
  },
  async ({ roomId, threadId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.markThreadAsResolved(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-mark-thread-as-unresolved",
  "Mark a Liveblocks thread as unresolved",
  {
    roomId: z.string(),
    threadId: z.string(),
    data: z.object({
      userId: z.string(),
    }),
  },
  async ({ roomId, threadId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.markThreadAsUnresolved(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-delete-thread",
  "Delete a Liveblocks thread",
  {
    roomId: z.string(),
    threadId: z.string(),
  },
  async ({ roomId, threadId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.deleteThread({ roomId, threadId }, { signal: extra.signal })
    );
  }
);

server.tool(
  "liveblocks-subscribe-to-thread",
  "Subscribe to a Liveblocks thread",
  {
    roomId: z.string(),
    threadId: z.string(),
    data: z.object({
      userId: z.string(),
    }),
  },
  async ({ roomId, threadId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.subscribeToThread(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-unsubscribe-from-thread",
  "Unsubscribe from a Liveblocks thread",
  {
    roomId: z.string(),
    threadId: z.string(),
    data: z.object({
      userId: z.string(),
    }),
  },
  async ({ roomId, threadId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.unsubscribeFromThread(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-get-thread-subscriptions",
  "Get a Liveblocks thread's subscriptions",
  {
    roomId: z.string(),
    threadId: z.string(),
  },
  async ({ roomId, threadId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getThreadSubscriptions(
        { roomId, threadId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-create-comment",
  `Create a Liveblocks comment. Always ask for a userId.`,
  {
    roomId: z.string(),
    threadId: z.string(),
    data: z.object({
      body: CommentBody,
      userId: z.string(),
      createdAt: z.date().optional(),
    }),
  },
  async ({ roomId, threadId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.createComment(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-get-comment",
  `Get a Liveblocks comment`,
  {
    roomId: z.string(),
    threadId: z.string(),
    commentId: z.string(),
  },
  async ({ roomId, threadId, commentId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getComment(
        { roomId, threadId, commentId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-edit-comment",
  `Edit a Liveblocks comment`,
  {
    roomId: z.string(),
    threadId: z.string(),
    commentId: z.string(),
    data: z.object({
      body: CommentBody,
      userId: z.string(),
      editedAt: z.date().optional(),
    }),
  },
  async ({ roomId, threadId, commentId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.editComment(
        { roomId, threadId, commentId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-delete-comment",
  `Delete a Liveblocks comment`,
  {
    roomId: z.string(),
    threadId: z.string(),
    commentId: z.string(),
  },
  async ({ roomId, threadId, commentId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.deleteComment(
        { roomId, threadId, commentId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-add-comment-reaction",
  `Add a reaction to a Liveblocks comment`,
  {
    roomId: z.string(),
    threadId: z.string(),
    commentId: z.string(),
    data: z.object({
      emoji: z.string(),
      userId: z.string(),
      createdAt: z.date().optional(),
    }),
  },
  async ({ roomId, threadId, commentId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.addCommentReaction(
        { roomId, threadId, commentId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-remove-comment-reaction",
  `Remove a reaction from a Liveblocks comment`,
  {
    roomId: z.string(),
    threadId: z.string(),
    commentId: z.string(),
    data: z.object({
      emoji: z.string(),
      userId: z.string(),
      removedAt: z.date().optional(),
    }),
  },
  async ({ roomId, threadId, commentId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.removeCommentReaction(
        { roomId, threadId, commentId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-get-room-subscription-settings",
  `Get a Liveblocks room's subscription settings`,
  {
    roomId: z.string(),
    userId: z.string(),
  },
  async ({ roomId, userId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getRoomSubscriptionSettings(
        { roomId, userId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-update-room-subscription-settings",
  `Update a Liveblocks room's subscription settings`,
  {
    roomId: z.string(),
    userId: z.string(),
    data: z.object({
      threads: z
        .union([
          z.literal("all"),
          z.literal("replies_and_mentions"),
          z.literal("none"),
        ])
        .optional(),
      textMentions: z.union([z.literal("mine"), z.literal("none")]).optional(),
    }),
  },
  async ({ roomId, userId, data }, extra) => {
    return await callLiveblocksApi(
      liveblocks.updateRoomSubscriptionSettings(
        { roomId, userId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-delete-room-subscription-settings",
  `Delete a Liveblocks room's subscription settings`,
  {
    roomId: z.string(),
    userId: z.string(),
  },
  async ({ roomId, userId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.deleteRoomSubscriptionSettings(
        { roomId, userId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "liveblocks-get-user-room-subscription-settings",
  `Get user's Liveblocks room subscription settings`,
  {
    userId: z.string(),
  },
  async ({ userId }, extra) => {
    return await callLiveblocksApi(
      liveblocks.getUserRoomSubscriptionSettings(
        { userId },
        { signal: extra.signal }
      )
    );
  }
);

// === Notifications ================================================
