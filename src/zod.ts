import { z } from "zod";

const CommentBodyText = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  code: z.boolean().optional(),
});

const CommentBodyMention = z.object({
  type: z.literal("mention"),
  id: z.string(),
});

const CommentBodyLink = z.object({
  type: z.literal("link"),
  url: z.string(),
  text: z.string().optional(),
});

const CommentBodyInlineElement = z.union([
  CommentBodyText,
  CommentBodyMention,
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

export const GroupsAccesses = z
  .record(z.string(), z.array(z.union([z.string(), z.null()])))
  .describe(
    `
      The group ID accesses for the room. Permissions can be: 
        
        1. ["room:write"] // public
        2. ["room:read", "room:presence:write"] // read-only
        3. [] // private   

         For example, when setting a "design" group to have full/public access:

         {
           design: ["room:write"]
         }

         Setting to null is used to remove an existing access level:

         {
           design: null
         }
      `
  );

export const UsersAccesses = z.record(
  z.string(),
  z.array(z.union([z.string(), z.null()]))
).describe(`
      The user ID accesses for the room. Permissions can be: 
        
        1. ["room:write"] // public
        2. ["room:read", "room:presence:write"] // read-only
        3. [] // private   

         For example, when setting "charlie" user ID to have full/public access:

         {
           charlie: ["room:write"]
         }

         Setting to null is used to remove an existing access level:

         {
           charlie: null
         }
      `);
