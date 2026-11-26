import { z } from "zod";

const CommentBodyText = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  code: z.boolean().optional(),
});

const CommentBodyUserMention = z.object({
  type: z.literal("mention"),
  kind: z.literal("user").default("user"),
  id: z.string(),
});

const CommentBodyGroupMention = z.object({
  type: z.literal("mention"),
  kind: z.literal("group"),
  id: z.string(),
  userIds: z.array(z.string()).optional(),
});

const CommentBodyLink = z.object({
  type: z.literal("link"),
  url: z.string(),
  text: z.string().optional(),
});

const CommentBodyInlineElement = z.union([
  CommentBodyText,
  CommentBodyUserMention,
  CommentBodyGroupMention,
  CommentBodyLink,
]);

const CommentBodyParagraph = z.object({
  type: z.literal("paragraph"),
  children: z.array(CommentBodyInlineElement),
});

export const CommentBody = z.object({
  version: z.literal(1),
  content: z.array(CommentBodyParagraph),
});

// The following caused MCP server issues when using `tuples` and `literals` together
// so I'm using `.describe` instead, as AI can figure it out this way

export const DefaultAccesses = z.array(z.string()).describe(
  `The default access permissions for the room. Permissions can be: 
        
        1. ["room:write"] // public
        2. ["room:read", "room:presence:write"] // read-only
        3. [] // private        
    `
);

const ACCESS_LEVELS = `Permissions can be:

        1. ["room:write"] // public
        2. ["room:read", "room:presence:write"] // read-only
        3. [] // private`;

export const GroupsAccesses = z.record(z.string(), z.array(z.string()))
  .describe(`
      The group ID accesses for the room. ${ACCESS_LEVELS}

         For example, when setting a "design" group to have full/public access:

         {
           design: ["room:write"]
         }
      `);

export const UsersAccesses = z.record(z.string(), z.array(z.string()))
  .describe(`
      The user ID accesses for the room. ${ACCESS_LEVELS}

         For example, when setting "charlie" user ID to have full/public access:

         {
           charlie: ["room:write"]
         }
      `);

export const GroupsAccessesUpdate = z.record(
  z.string(),
  z.union([z.array(z.string()), z.null()])
).describe(`
      The group ID accesses to change. Groups left out keep their access. ${ACCESS_LEVELS}

         For example, when setting a "design" group to have full/public access:

         {
           design: ["room:write"]
         }

         Setting to null is used to remove an existing access level:

         {
           design: null
         }
      `);

export const UsersAccessesUpdate = z.record(
  z.string(),
  z.union([z.array(z.string()), z.null()])
).describe(`
      The user ID accesses to change. Users left out keep their access. ${ACCESS_LEVELS}

         For example, when setting "charlie" user ID to have full/public access:

         {
           charlie: ["room:write"]
         }

         Setting to null is used to remove an existing access level:

         {
           charlie: null
         }
      `);

export const RoomMetadata = z
  .record(z.string(), z.union([z.string(), z.array(z.string())]))
  .describe("Each value is a string or a list of strings.");

export const RoomMetadataUpdate = z
  .record(z.string(), z.union([z.string(), z.array(z.string()), z.null()]))
  .describe(
    "Each value is a string or a list of strings. `null` removes a key."
  );

export const CommentMetadata = z
  .record(z.string(), z.union([z.string(), z.boolean(), z.number()]))
  .describe("The comment's metadata.");

export const AttachmentIds = z
  .array(z.string())
  .max(10)
  .describe("The IDs of attachments already uploaded to the room, at most 10.");

export const StartingAfter = z
  .string()
  .describe(
    "A cursor used for pagination. Get the value from the `nextCursor` of the previous page."
  );

export function limitOf(what: string, max = 100, defaultLimit = 20) {
  return z
    .number()
    .int()
    .min(1)
    .max(max)
    .describe(
      `A limit on the number of ${what} to be returned, from 1 to ${max}. Defaults to ${defaultLimit}.`
    );
}

// A tool's arguments are JSON, which has no dates, so a date arrives as an
// ISO 8601 string
export const IsoDate = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const CopilotSettings = z.object({
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
  frequencyPenalty: z.number().optional(),
  presencePenalty: z.number().optional(),
  stopSequences: z.array(z.string()).optional(),
  seed: z.number().optional(),
  maxRetries: z.number().optional(),
});

export const CopilotProvider = z.enum([
  "openai",
  "anthropic",
  "google",
  "openai-compatible",
]);

export const CopilotProviderOptions = z
  .record(z.string(), z.any())
  .describe(
    'Options for the chosen provider, under its name: `{ openai: { reasoningEffort: "low" | "medium" | "high", webSearch: { allowedDomains: string[] } } }`, `{ anthropic: { thinking: { type: "enabled", budgetTokens: number } | { type: "disabled" }, webSearch: { allowedDomains: string[] } } }`, or `{ google: { thinkingConfig: { thinkingBudget: number } } }`.'
  );
