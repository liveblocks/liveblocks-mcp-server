import { z } from "zod";
import { callLiveblocksApi } from "./utils.js";
import { Liveblocks } from "@liveblocks/node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CommentBody,
  DefaultAccesses,
  GroupsAccesses,
  UsersAccesses,
} from "./zod.js";

export const server = new McpServer({
  name: "liveblocks-mcp-server",
  version: "1.0.0",
});

// === Setup ========================================================

let client: Liveblocks;

function getLiveblocks() {
  if (!client) {
    client = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
    });
  }
  return client;
}

// === Rooms ========================================================

server.tool(
  "get-rooms",
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
      getLiveblocks().getRooms(
        { limit, userId, groupIds, startingAfter, query },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "create-room",
  "Create a Liveblocks room",
  {
    roomId: z.string(),
    defaultAccesses: DefaultAccesses,
    groupsAccesses: GroupsAccesses.optional(),
    usersAccesses: UsersAccesses.optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  },
  async (
    { roomId, defaultAccesses, groupsAccesses, usersAccesses, metadata },
    extra
  ) => {
    return await callLiveblocksApi(
      getLiveblocks().createRoom(
        roomId,
        {
          defaultAccesses: defaultAccesses as any,
          groupsAccesses: groupsAccesses as any,
          usersAccesses: usersAccesses as any,
          metadata,
        },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "get-room",
  "Get a Liveblocks room",
  {
    roomId: z.string(),
  },
  async ({ roomId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getRoom(roomId, { signal: extra.signal })
    );
  }
);

server.tool(
  "update-room",
  "Update a Liveblocks room",
  {
    roomId: z.string(),
    defaultAccesses: DefaultAccesses,
    groupsAccesses: GroupsAccesses.optional(),
    usersAccesses: UsersAccesses.optional(),
    metadata: z.record(z.string(), z.union([z.string(), z.null()])).optional(),
  },
  async (
    { roomId, defaultAccesses, groupsAccesses, usersAccesses, metadata },
    extra
  ) => {
    return await callLiveblocksApi(
      getLiveblocks().updateRoom(
        roomId,
        {
          defaultAccesses: defaultAccesses as any,
          groupsAccesses: groupsAccesses as any,
          usersAccesses: usersAccesses as any,
          metadata,
        },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "delete-room",
  "Delete a Liveblocks room",
  {
    roomId: z.string(),
  },
  async ({ roomId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().deleteRoom(roomId, { signal: extra.signal })
    );
  }
);

server.tool(
  "update-room-id",
  "Update a Liveblocks room's ID",
  {
    roomId: z.string(),
    newRoomId: z.string(),
  },
  async ({ roomId, newRoomId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().updateRoomId(
        { currentRoomId: roomId, newRoomId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "get-active-users",
  "Get a Liveblocks room's active users",
  {
    roomId: z.string(),
  },
  async ({ roomId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getActiveUsers(roomId, { signal: extra.signal })
    );
  }
);

server.tool(
  "broadcast-event",
  "Broadcast an event to a Liveblocks room",
  {
    roomId: z.string(),
    event: z.record(z.string(), z.any()),
  },
  async ({ roomId, event }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().broadcastEvent(roomId, event, { signal: extra.signal })
    );
  }
);

// === Storage ======================================================

server.tool(
  "get-storage-document",
  "Get a Liveblocks storage document",
  {
    roomId: z.string(),
  },
  async ({ roomId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getStorageDocument(roomId, "json", {
        signal: extra.signal,
      })
    );
  }
);

// === Yjs ==========================================================

server.tool(
  "get-yjs-document",
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
      getLiveblocks().getYjsDocument(roomId, options, { signal: extra.signal })
    );
  }
);

// === Comments =====================================================

server.tool(
  "get-threads",
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
      getLiveblocks().getThreads({ roomId, query }, { signal: extra.signal })
    );
  }
);

server.tool(
  "create-thread",
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
      getLiveblocks().createThread({ roomId, data }, { signal: extra.signal })
    );
  }
);

server.tool(
  "get-thread",
  "Get a Liveblocks thread",
  {
    roomId: z.string(),
    threadId: z.string(),
  },
  async ({ roomId, threadId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getThread({ roomId, threadId }, { signal: extra.signal })
    );
  }
);

server.tool(
  "get-thread-participants",
  "Get a Liveblocks thread's participants",
  {
    roomId: z.string(),
    threadId: z.string(),
  },
  async ({ roomId, threadId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getThreadParticipants(
        { roomId, threadId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "edit-thread-metadata",
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
      getLiveblocks().editThreadMetadata(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "mark-thread-as-resolved",
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
      getLiveblocks().markThreadAsResolved(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "mark-thread-as-unresolved",
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
      getLiveblocks().markThreadAsUnresolved(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "delete-thread",
  "Delete a Liveblocks thread",
  {
    roomId: z.string(),
    threadId: z.string(),
  },
  async ({ roomId, threadId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().deleteThread(
        { roomId, threadId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "subscribe-to-thread",
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
      getLiveblocks().subscribeToThread(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "unsubscribe-from-thread",
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
      getLiveblocks().unsubscribeFromThread(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "get-thread-subscriptions",
  "Get a Liveblocks thread's subscriptions",
  {
    roomId: z.string(),
    threadId: z.string(),
  },
  async ({ roomId, threadId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getThreadSubscriptions(
        { roomId, threadId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "create-comment",
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
      getLiveblocks().createComment(
        { roomId, threadId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "get-comment",
  `Get a Liveblocks comment`,
  {
    roomId: z.string(),
    threadId: z.string(),
    commentId: z.string(),
  },
  async ({ roomId, threadId, commentId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getComment(
        { roomId, threadId, commentId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "edit-comment",
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
      getLiveblocks().editComment(
        { roomId, threadId, commentId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "delete-comment",
  `Delete a Liveblocks comment`,
  {
    roomId: z.string(),
    threadId: z.string(),
    commentId: z.string(),
  },
  async ({ roomId, threadId, commentId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().deleteComment(
        { roomId, threadId, commentId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "add-comment-reaction",
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
      getLiveblocks().addCommentReaction(
        { roomId, threadId, commentId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "remove-comment-reaction",
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
      getLiveblocks().removeCommentReaction(
        { roomId, threadId, commentId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "get-room-subscription-settings",
  `Get a Liveblocks room's subscription settings`,
  {
    roomId: z.string(),
    userId: z.string(),
  },
  async ({ roomId, userId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getRoomSubscriptionSettings(
        { roomId, userId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "update-room-subscription-settings",
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
      getLiveblocks().updateRoomSubscriptionSettings(
        { roomId, userId, data },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "delete-room-subscription-settings",
  `Delete a Liveblocks room's subscription settings`,
  {
    roomId: z.string(),
    userId: z.string(),
  },
  async ({ roomId, userId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().deleteRoomSubscriptionSettings(
        { roomId, userId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "get-user-room-subscription-settings",
  `Get a user's room subscription settings`,
  {
    userId: z.string(),
  },
  async ({ userId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getUserRoomSubscriptionSettings(
        { userId },
        { signal: extra.signal }
      )
    );
  }
);

// === Notifications ================================================

server.tool(
  "get-inbox-notifications",
  `Get recent Liveblocks inbox notifications`,
  {
    userId: z.string(),
    query: z
      .object({
        unread: z.boolean(),
      })
      .optional(),
    startingAfter: z.string().optional(),
    limit: z.number().optional(),
  },
  async ({ userId, query, startingAfter, limit }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getInboxNotifications(
        { userId, query, startingAfter, limit },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "get-inbox-notification",
  "Get a Liveblocks inbox notification",
  {
    userId: z.string(),
    inboxNotificationId: z.string(),
  },
  async ({ userId, inboxNotificationId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getInboxNotification(
        { userId, inboxNotificationId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "trigger-inbox-notification",
  "Create a custom Liveblocks inbox notification",
  {
    userId: z.string(),
    kind: z.string().regex(/^\$/, {
      message: "String must start with '$'",
    }),
    subjectId: z.string(),
    activityData: z
      .record(z.string(), z.union([z.string(), z.boolean(), z.number()]))
      .describe("Custom data related to the notification"),
    roomId: z
      .string()
      .optional()
      .describe("Don't add this unless specifically asked"),
  },
  async ({ userId, kind, subjectId, activityData, roomId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().triggerInboxNotification(
        { userId, kind: kind as `$${string}`, subjectId, activityData, roomId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "delete-inbox-notification",
  "Delete a Liveblocks inbox notification",
  {
    userId: z.string(),
    inboxNotificationId: z.string(),
  },
  async ({ userId, inboxNotificationId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().deleteInboxNotification(
        { userId, inboxNotificationId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "delete-all-inbox-notifications",
  "Delete all Liveblocks inbox notifications",
  {
    userId: z.string(),
  },
  async ({ userId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().deleteAllInboxNotifications(
        { userId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "get-notification-settings",
  "Get a Liveblocks notification settings",
  {
    userId: z.string(),
  },
  async ({ userId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getNotificationSettings(
        { userId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "update-notification-settings",
  "Update Liveblocks notification settings",
  {
    userId: z.string(),
    data: z.record(
      z.string(),
      z.record(
        z.union([
          z.literal("thread"),
          z.literal("textMention"),
          z.string().regex(/^\$/, {
            message: "String must start with '$'",
          }),
        ]),
        z.boolean()
      )
    ),
  },
  async ({ userId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().getNotificationSettings(
        { userId },
        { signal: extra.signal }
      )
    );
  }
);

server.tool(
  "delete-notification-settings",
  "Delete Liveblocks notification settings",
  {
    userId: z.string(),
  },
  async ({ userId }, extra) => {
    return await callLiveblocksApi(
      getLiveblocks().deleteNotificationSettings(
        { userId },
        { signal: extra.signal }
      )
    );
  }
);
