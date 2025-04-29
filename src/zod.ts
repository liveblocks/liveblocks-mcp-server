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

export const ThreadMetadata = z.record(
  z.string(),
  z.union([z.string(), z.boolean(), z.number()])
);
