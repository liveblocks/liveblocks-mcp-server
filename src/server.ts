import { z } from "zod";
import { callLiveblocksApi } from "./utils.js";
import {
  Liveblocks,
  type CreateAiCopilotOptions,
  type UpdateAiCopilotOptions,
} from "@liveblocks/node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AttachmentIds,
  CommentBody,
  CommentMetadata,
  CopilotProvider,
  CopilotProviderOptions,
  CopilotSettings,
  DefaultAccesses,
  GroupsAccesses,
  GroupsAccessesUpdate,
  IsoDate,
  limitOf,
  RoomMetadata,
  RoomMetadataUpdate,
  StartingAfter,
  UsersAccesses,
  UsersAccessesUpdate,
} from "./zod.js";

/**
 * Creates a new MCP server bound to a single Liveblocks secret key.
 *
 * A fresh instance is created per stdio process, and per HTTP request when
 * hosted, so that each caller's secret key is isolated.
 */
export function createServer(secretKey: string | undefined) {
  const server = new McpServer({
    name: "liveblocks-mcp-server",
    version: "1.0.0",
  });

  // === Setup ========================================================

  let client: Liveblocks;

  function getLiveblocks() {
    if (!client) {
      // Created lazily so that a missing key surfaces as a tool error rather
      // than preventing the server from starting.
      client = new Liveblocks({
        secret: secretKey as string,
      });
    }
    return client;
  }

  // === Rooms ========================================================

  server.tool(
    "get-rooms",
    `Get recent Liveblocks rooms`,
    {
      limit: limitOf("rooms").optional(),
      organizationId: z
        .string()
        .optional()
        .describe("A filter on organization ID."),
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
    async (
      { limit, organizationId, userId, groupIds, startingAfter, query },
      extra
    ) => {
      return await callLiveblocksApi(
        getLiveblocks().getRooms(
          { limit, organizationId, userId, groupIds, startingAfter, query },
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
      metadata: RoomMetadata.optional(),
      organizationId: z
        .string()
        .optional()
        .describe(
          "The organization to create the room in. Defaults to `default`."
        ),
    },
    async (
      {
        roomId,
        defaultAccesses,
        groupsAccesses,
        usersAccesses,
        metadata,
        organizationId,
      },
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
            organizationId,
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
    "Update a Liveblocks room. Only the fields given are changed, and at least one must be given.",
    {
      roomId: z.string(),
      defaultAccesses: DefaultAccesses.optional(),
      groupsAccesses: GroupsAccessesUpdate.optional(),
      usersAccesses: UsersAccessesUpdate.optional(),
      metadata: RoomMetadataUpdate.optional(),
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
    "get-or-create-room",
    "Get a Liveblocks room, or create it if it doesn't exist. The accesses and metadata are used only when the room is created.",
    {
      roomId: z.string(),
      defaultAccesses: DefaultAccesses,
      groupsAccesses: GroupsAccesses.optional(),
      usersAccesses: UsersAccesses.optional(),
      metadata: RoomMetadata.optional(),
      organizationId: z
        .string()
        .optional()
        .describe(
          "The organization to create the room in. Defaults to `default`."
        ),
    },
    async (
      {
        roomId,
        defaultAccesses,
        groupsAccesses,
        usersAccesses,
        metadata,
        organizationId,
      },
      extra
    ) => {
      return await callLiveblocksApi(
        getLiveblocks().getOrCreateRoom(
          roomId,
          {
            defaultAccesses: defaultAccesses as any,
            groupsAccesses: groupsAccesses as any,
            usersAccesses: usersAccesses as any,
            metadata,
            organizationId,
          },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "upsert-room",
    "Update a Liveblocks room, or create it if it doesn't exist. `defaultAccesses` must be set in `update` or in `create`.",
    {
      roomId: z.string(),
      update: z
        .object({
          defaultAccesses: DefaultAccesses.optional(),
          groupsAccesses: GroupsAccessesUpdate.optional(),
          usersAccesses: UsersAccessesUpdate.optional(),
          metadata: RoomMetadataUpdate.optional(),
        })
        .describe(
          "Applied to the room whether or not it existed. Must set at least one field."
        ),
      // No organizationId in `create`: the API accepts it there, but creates
      // the room in the default organization regardless.
      create: z
        .object({
          defaultAccesses: DefaultAccesses,
          groupsAccesses: GroupsAccesses.optional(),
          usersAccesses: UsersAccesses.optional(),
          metadata: RoomMetadata.optional(),
        })
        .optional()
        .describe(
          "Used only when the room doesn't exist yet, and ignored otherwise."
        ),
    },
    async ({ roomId, update, create }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().upsertRoom(
          roomId,
          {
            update: {
              defaultAccesses: update.defaultAccesses as any,
              groupsAccesses: update.groupsAccesses as any,
              usersAccesses: update.usersAccesses as any,
              metadata: update.metadata,
            },
            create: create && {
              defaultAccesses: create.defaultAccesses as any,
              groupsAccesses: create.groupsAccesses as any,
              usersAccesses: create.usersAccesses as any,
              metadata: create.metadata,
            },
          },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "prewarm-room",
    "Prepare a Liveblocks room for connections, so the next one is faster",
    {
      roomId: z.string(),
    },
    async ({ roomId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().prewarmRoom(roomId, { signal: extra.signal })
      );
    }
  );

  server.tool(
    "set-presence",
    "Show a user as present in a Liveblocks room for a limited time, for example an AI agent. Always ask for a userId.",
    {
      roomId: z.string(),
      userId: z.string(),
      data: z
        .record(z.string(), z.any())
        .describe("The user's presence, as a JSON object."),
      userInfo: z
        .object({
          name: z.string().optional(),
          avatar: z.string().optional(),
        })
        .catchall(z.any())
        .describe("Information about the user, shown to others. Can be `{}`."),
      ttl: z
        .number()
        .int()
        .min(2)
        .max(3600)
        .optional()
        .describe(
          "How long the presence lasts, in seconds, from 2 to 3600. Defaults to 60."
        ),
    },
    async ({ roomId, userId, data, userInfo, ttl }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().setPresence(
          roomId,
          { userId, data, userInfo, ttl },
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
      format: z
        .enum(["json", "plain-lson"])
        .optional()
        .describe(
          'The format of the result. `"json"`, the default, is plain JSON, which doesn\'t tell a LiveObject from a LiveMap or a LiveList from an array. `"plain-lson"` keeps them apart, as `{ "liveblocksType": "LiveObject", "data": { … } }`, and is what initialize-storage-document takes.'
        ),
    },
    async ({ roomId, format }, extra) => {
      const liveblocks = getLiveblocks();
      const options = { signal: extra.signal };
      return await callLiveblocksApi(
        format === "plain-lson"
          ? liveblocks.getStorageDocument(roomId, "plain-lson", options)
          : liveblocks.getStorageDocument(roomId, "json", options)
      );
    }
  );

  server.tool(
    "initialize-storage-document",
    "Initialize a Liveblocks room's storage. The room must exist and its storage must be empty. Disconnects the room's users.",
    {
      roomId: z.string(),
      document: z
        .object({
          liveblocksType: z.literal("LiveObject"),
          data: z.record(z.string(), z.any()),
        })
        .describe(
          'The root of the storage, in Plain LSON: plain JSON, in which a LiveObject is `{ "liveblocksType": "LiveObject", "data": { … } }`, a LiveMap is `{ "liveblocksType": "LiveMap", "data": { … } }` and a LiveList is `{ "liveblocksType": "LiveList", "data": [ … ] }`. These can be nested.'
        ),
    },
    async ({ roomId, document }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().initializeStorageDocument(roomId, document, {
          signal: extra.signal,
        })
      );
    }
  );

  server.tool(
    "delete-storage-document",
    "Delete all of a Liveblocks room's storage. Disconnects the room's users.",
    {
      roomId: z.string(),
    },
    async ({ roomId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().deleteStorageDocument(roomId, { signal: extra.signal })
      );
    }
  );

  server.tool(
    "get-file-url",
    "Get a file in a Liveblocks room's storage, with a temporary URL to download it",
    {
      roomId: z.string(),
      fileId: z.string(),
    },
    async ({ roomId, fileId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getFileUrl(
          { roomId, file: fileId },
          { signal: extra.signal }
        )
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
        getLiveblocks().getYjsDocument(roomId, options, {
          signal: extra.signal,
        })
      );
    }
  );

  // === Version history ==============================================

  server.tool(
    "get-version-history",
    "Get a Liveblocks room's version history, from newest to oldest",
    {
      roomId: z.string(),
      limit: limitOf("versions").optional(),
      cursor: StartingAfter.optional(),
    },
    async ({ roomId, limit, cursor }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getVersionHistory(
          roomId,
          { limit, cursor },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "create-version-history-snapshot",
    "Save a version of a Liveblocks room's storage and Yjs documents to its version history",
    {
      roomId: z.string(),
    },
    async ({ roomId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().createVersionHistorySnapshot(roomId, {
          signal: extra.signal,
        })
      );
    }
  );

  server.tool(
    "delete-version",
    "Delete a version from a Liveblocks room's version history",
    {
      roomId: z.string(),
      versionId: z.string(),
    },
    async ({ roomId, versionId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().deleteVersion(
          { roomId, versionId },
          { signal: extra.signal }
        )
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
          createdAt: IsoDate.optional(),
          attachmentIds: AttachmentIds.optional(),
          metadata: CommentMetadata.optional(),
        }),
        metadata: z
          .record(z.string(), z.union([z.string(), z.boolean(), z.number()]))
          .optional()
          .describe("The thread's metadata."),
        visibility: z
          .enum(["public", "private"])
          .optional()
          .describe("Who can see the thread. Defaults to `public`."),
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
        getLiveblocks().getThread(
          { roomId, threadId },
          { signal: extra.signal }
        )
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
        updatedAt: IsoDate.optional(),
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
        createdAt: IsoDate.optional(),
        attachmentIds: AttachmentIds.optional(),
        metadata: CommentMetadata.optional(),
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
        editedAt: IsoDate.optional(),
        attachmentIds: AttachmentIds.optional().describe(
          "The IDs of all the attachments the comment should have afterwards, at most 10: any other attachment is removed from it. Leave this out to keep the attachments as they are."
        ),
        metadata: z
          .record(
            z.string(),
            z.union([z.string(), z.boolean(), z.number(), z.null()])
          )
          .optional()
          .describe(
            "Metadata to merge into the comment's. `null` removes a key."
          ),
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
    "edit-comment-metadata",
    `Edit a Liveblocks comment's metadata. \`null\` can be used to remove a key.`,
    {
      roomId: z.string(),
      threadId: z.string(),
      commentId: z.string(),
      data: z.object({
        metadata: z.record(
          z.string(),
          z.union([z.string(), z.boolean(), z.number(), z.null()])
        ),
        userId: z.string(),
        updatedAt: IsoDate.optional(),
      }),
    },
    async ({ roomId, threadId, commentId, data }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().editCommentMetadata(
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
        createdAt: IsoDate.optional(),
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
        removedAt: IsoDate.optional(),
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
    "get-attachment",
    "Get a Liveblocks comment attachment, with a temporary URL to download it",
    {
      roomId: z.string(),
      attachmentId: z.string(),
    },
    async ({ roomId, attachmentId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getAttachment(
          { roomId, attachmentId },
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
        textMentions: z
          .union([z.literal("mine"), z.literal("none")])
          .optional(),
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
      organizationId: z
        .string()
        .optional()
        .describe("Only return the settings of rooms in this organization."),
      limit: limitOf("settings", 50, 50).optional(),
      startingAfter: StartingAfter.optional(),
    },
    async ({ userId, organizationId, limit, startingAfter }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getUserRoomSubscriptionSettings(
          { userId, organizationId, limit, startingAfter },
          { signal: extra.signal }
        )
      );
    }
  );

  // === Feeds ========================================================

  server.tool(
    "get-feeds",
    "Get a Liveblocks room's feeds, from newest to oldest",
    {
      roomId: z.string(),
    },
    async ({ roomId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getFeeds({ roomId }, { signal: extra.signal })
      );
    }
  );

  server.tool(
    "create-feed",
    "Create a feed in a Liveblocks room",
    {
      roomId: z.string(),
      feedId: z.string(),
      metadata: RoomMetadata.optional(),
      createdAt: z
        .number()
        .optional()
        .describe(
          "The feed's creation time, in milliseconds since the Unix epoch. Defaults to now."
        ),
    },
    async ({ roomId, feedId, metadata, createdAt }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().createFeed(
          { roomId, feedId, metadata, createdAt },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "get-feed",
    "Get a feed in a Liveblocks room",
    {
      roomId: z.string(),
      feedId: z.string(),
    },
    async ({ roomId, feedId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getFeed({ roomId, feedId }, { signal: extra.signal })
      );
    }
  );

  server.tool(
    "update-feed",
    "Replace the metadata of a feed in a Liveblocks room",
    {
      roomId: z.string(),
      feedId: z.string(),
      metadata: z
        .record(z.string(), z.union([z.string(), z.array(z.string())]))
        .describe(
          "The feed's new metadata, which replaces all of the old. Each value is a string or a list of strings."
        ),
    },
    async ({ roomId, feedId, metadata }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().updateFeed(
          { roomId, feedId, metadata },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "delete-feed",
    "Delete a feed in a Liveblocks room, with its messages",
    {
      roomId: z.string(),
      feedId: z.string(),
    },
    async ({ roomId, feedId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().deleteFeed({ roomId, feedId }, { signal: extra.signal })
      );
    }
  );

  server.tool(
    "get-feed-messages",
    "Get the messages of a feed, from newest to oldest",
    {
      roomId: z.string(),
      feedId: z.string(),
    },
    async ({ roomId, feedId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getFeedMessages(
          { roomId, feedId },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "create-feed-message",
    "Add a message to a feed in a Liveblocks room",
    {
      roomId: z.string(),
      feedId: z.string(),
      data: z
        .record(z.string(), z.any())
        .describe("The message, as a JSON object."),
      id: z
        .string()
        .optional()
        .describe("The ID of the message. Generated if left out."),
      createdAt: z
        .number()
        .optional()
        .describe(
          "The message's creation time, in milliseconds since the Unix epoch. Defaults to now."
        ),
    },
    async ({ roomId, feedId, data, id, createdAt }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().createFeedMessage(
          { roomId, feedId, data, id, createdAt },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "update-feed-message",
    "Replace the data of a message in a feed",
    {
      roomId: z.string(),
      feedId: z.string(),
      messageId: z.string(),
      data: z
        .record(z.string(), z.any())
        .describe("The message, as a JSON object."),
      updatedAt: z
        .number()
        .optional()
        .describe(
          "The message's update time, in milliseconds since the Unix epoch. Defaults to now."
        ),
    },
    async ({ roomId, feedId, messageId, data, updatedAt }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().updateFeedMessage(
          { roomId, feedId, messageId, data, updatedAt },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "delete-feed-message",
    "Delete a message from a feed",
    {
      roomId: z.string(),
      feedId: z.string(),
      messageId: z.string(),
    },
    async ({ roomId, feedId, messageId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().deleteFeedMessage(
          { roomId, feedId, messageId },
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
      organizationId: z
        .string()
        .optional()
        .describe("Only return the notifications of this organization."),
      query: z
        .object({
          unread: z.boolean(),
        })
        .optional(),
      startingAfter: z.string().optional(),
      limit: z.number().optional(),
    },
    async ({ userId, organizationId, query, startingAfter, limit }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getInboxNotifications(
          { userId, organizationId, query, startingAfter, limit },
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
      organizationId: z
        .string()
        .optional()
        .describe(
          "The organization to create the notification in. Defaults to `default`."
        ),
    },
    async (
      { userId, kind, subjectId, activityData, roomId, organizationId },
      extra
    ) => {
      return await callLiveblocksApi(
        getLiveblocks().triggerInboxNotification(
          {
            userId,
            kind: kind as `$${string}`,
            subjectId,
            activityData,
            roomId,
            organizationId,
          },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "mark-inbox-notification-as-read",
    "Mark a Liveblocks inbox notification as read",
    {
      inboxNotificationId: z.string(),
    },
    async ({ inboxNotificationId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().markInboxNotificationAsRead(
          { inboxNotificationId },
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
      organizationId: z
        .string()
        .optional()
        .describe("Only delete the notifications of this organization."),
    },
    async ({ userId, organizationId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().deleteAllInboxNotifications(
          { userId, organizationId },
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
    async ({ userId, data }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().updateNotificationSettings(
          { userId, data },
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

  // === Groups =======================================================

  server.tool(
    "get-groups",
    "Get recent Liveblocks groups",
    {
      limit: limitOf("groups").optional(),
      startingAfter: StartingAfter.optional(),
    },
    async ({ limit, startingAfter }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getGroups(
          { limit, startingAfter },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "create-group",
    "Create a Liveblocks group",
    {
      groupId: z.string().describe("The ID of the group."),
      memberIds: z
        .array(z.string())
        .optional()
        .describe("The IDs of the users to add to the group."),
      organizationId: z
        .string()
        .optional()
        .describe(
          "The organization to create the group in. Defaults to `default`."
        ),
      scopes: z
        .object({ mention: z.literal(true).optional() })
        .optional()
        .describe(
          "What the group can be used for. `{ mention: true }` is the only value, and every group can be mentioned whether or not it's given."
        ),
    },
    async ({ groupId, memberIds, organizationId, scopes }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().createGroup(
          { groupId, memberIds, organizationId, scopes },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "get-group",
    "Get a Liveblocks group and its members",
    {
      groupId: z.string(),
    },
    async ({ groupId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getGroup({ groupId }, { signal: extra.signal })
      );
    }
  );

  server.tool(
    "delete-group",
    "Delete a Liveblocks group",
    {
      groupId: z.string(),
    },
    async ({ groupId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().deleteGroup({ groupId }, { signal: extra.signal })
      );
    }
  );

  server.tool(
    "add-group-members",
    "Add users to a Liveblocks group",
    {
      groupId: z.string(),
      memberIds: z.array(z.string()),
    },
    async ({ groupId, memberIds }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().addGroupMembers(
          { groupId, memberIds },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "remove-group-members",
    "Remove users from a Liveblocks group",
    {
      groupId: z.string(),
      memberIds: z.array(z.string()),
    },
    async ({ groupId, memberIds }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().removeGroupMembers(
          { groupId, memberIds },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "get-user-groups",
    "Get the Liveblocks groups a user is a member of",
    {
      userId: z.string(),
      limit: limitOf("groups").optional(),
      startingAfter: StartingAfter.optional(),
    },
    async ({ userId, limit, startingAfter }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getUserGroups(
          { userId, limit, startingAfter },
          { signal: extra.signal }
        )
      );
    }
  );

  // === AI Copilots ==================================================

  server.tool(
    "get-ai-copilots",
    "Get recent Liveblocks AI Copilots",
    {
      limit: limitOf("copilots").optional(),
      startingAfter: StartingAfter.optional(),
    },
    async ({ limit, startingAfter }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getAiCopilots(
          { limit, startingAfter },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "create-ai-copilot",
    "Create a Liveblocks AI Copilot. Always ask for the provider's API key.",
    {
      name: z.string(),
      description: z.string().optional(),
      systemPrompt: z.string(),
      knowledgePrompt: z.string().optional(),
      alwaysUseKnowledge: z.boolean().optional(),
      provider: CopilotProvider,
      providerModel: z
        .string()
        .describe(
          'The provider\'s ID of the model, for example, `"gpt-5.5"`. Unless the provider is `"openai-compatible"`, it must be a model Liveblocks supports.'
        ),
      providerApiKey: z
        .string()
        .describe("The API key for the provider. Never returned by any tool."),
      providerOptions: CopilotProviderOptions.optional(),
      settings: CopilotSettings.optional(),
      compatibleProviderName: z
        .string()
        .optional()
        .describe(
          'The name of the provider. Required when the provider is `"openai-compatible"`.'
        ),
      providerBaseUrl: z
        .string()
        .optional()
        .describe(
          'The base URL of the provider\'s API. Required when the provider is `"openai-compatible"`.'
        ),
    },
    async (params, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().createAiCopilot(
          // The client's type ties each provider to its models and options,
          // which a flat tool schema can't express. The API checks them.
          params as CreateAiCopilotOptions,
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "get-ai-copilot",
    "Get a Liveblocks AI Copilot",
    {
      copilotId: z.string(),
    },
    async ({ copilotId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getAiCopilot(copilotId, { signal: extra.signal })
      );
    }
  );

  server.tool(
    "update-ai-copilot",
    "Update a Liveblocks AI Copilot. Only the fields given are changed.",
    {
      copilotId: z.string(),
      name: z.string().optional(),
      description: z
        .string()
        .nullable()
        .optional()
        .describe("`null` removes the description."),
      systemPrompt: z.string().optional(),
      knowledgePrompt: z
        .string()
        .nullable()
        .optional()
        .describe("`null` removes the knowledge prompt."),
      alwaysUseKnowledge: z.boolean().optional(),
      provider: CopilotProvider.optional(),
      providerModel: z.string().optional(),
      providerApiKey: z.string().optional(),
      providerOptions: CopilotProviderOptions.nullable().optional(),
      settings: CopilotSettings.nullable().optional(),
      compatibleProviderName: z.string().optional(),
      providerBaseUrl: z.string().optional(),
    },
    async ({ copilotId, ...params }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().updateAiCopilot(
          copilotId,
          // As in create-ai-copilot, the API checks what goes with a provider
          params as UpdateAiCopilotOptions,
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "delete-ai-copilot",
    "Delete a Liveblocks AI Copilot",
    {
      copilotId: z.string(),
    },
    async ({ copilotId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().deleteAiCopilot(copilotId, { signal: extra.signal })
      );
    }
  );

  server.tool(
    "get-knowledge-sources",
    "Get the knowledge sources of a Liveblocks AI Copilot",
    {
      copilotId: z.string(),
      limit: limitOf("knowledge sources").optional(),
      startingAfter: StartingAfter.optional(),
    },
    async ({ copilotId, limit, startingAfter }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getKnowledgeSources(
          { copilotId, limit, startingAfter },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "get-knowledge-source",
    "Get a knowledge source of a Liveblocks AI Copilot",
    {
      copilotId: z.string(),
      knowledgeSourceId: z.string(),
    },
    async ({ copilotId, knowledgeSourceId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getKnowledgeSource(
          { copilotId, knowledgeSourceId },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "create-web-knowledge-source",
    "Add a web page, a website or a sitemap to a Liveblocks AI Copilot's knowledge",
    {
      copilotId: z.string(),
      url: z.string(),
      type: z
        .enum(["individual_link", "crawl", "sitemap"])
        .describe(
          "`individual_link` reads the one page, `crawl` follows the links from it, and `sitemap` reads the pages listed in the sitemap at the URL."
        ),
    },
    async ({ copilotId, url, type }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().createWebKnowledgeSource(
          { copilotId, url, type },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "get-web-knowledge-source-links",
    "Get the pages read for a web knowledge source of a Liveblocks AI Copilot",
    {
      copilotId: z.string(),
      knowledgeSourceId: z.string(),
      limit: limitOf("links").optional(),
      startingAfter: StartingAfter.optional(),
    },
    async ({ copilotId, knowledgeSourceId, limit, startingAfter }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getWebKnowledgeSourceLinks(
          { copilotId, knowledgeSourceId, limit, startingAfter },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "delete-web-knowledge-source",
    "Delete a web knowledge source of a Liveblocks AI Copilot",
    {
      copilotId: z.string(),
      knowledgeSourceId: z.string(),
    },
    async ({ copilotId, knowledgeSourceId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().deleteWebKnowledgeSource(
          { copilotId, knowledgeSourceId },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "get-file-knowledge-source-markdown",
    "Get the content of a file knowledge source of a Liveblocks AI Copilot, as Markdown",
    {
      copilotId: z.string(),
      knowledgeSourceId: z.string(),
    },
    async ({ copilotId, knowledgeSourceId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().getFileKnowledgeSourceMarkdown(
          { copilotId, knowledgeSourceId },
          { signal: extra.signal }
        )
      );
    }
  );

  server.tool(
    "delete-file-knowledge-source",
    "Delete a file knowledge source of a Liveblocks AI Copilot",
    {
      copilotId: z.string(),
      knowledgeSourceId: z.string(),
    },
    async ({ copilotId, knowledgeSourceId }, extra) => {
      return await callLiveblocksApi(
        getLiveblocks().deleteFileKnowledgeSource(
          { copilotId, knowledgeSourceId },
          { signal: extra.signal }
        )
      );
    }
  );

  return server;
}
