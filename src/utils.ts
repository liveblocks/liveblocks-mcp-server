import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export async function callLiveblocksApi(
  liveblocksPromise: Promise<any>
): Promise<CallToolResult> {
  try {
    const data = await liveblocksPromise;

    if (!data) {
      return {
        content: [{ type: "text", text: "Success. No data returned." }],
      };
    }

    // Text, such as a file's Markdown, is returned as it is: as JSON it would
    // be one quoted line with its line breaks escaped
    if (typeof data === "string") {
      return { content: [{ type: "text", text: data }] };
    }

    return {
      content: [
        {
          type: "text",
          text: "Here is the data. If the user has no specific questions, return it in a JSON code block",
        },
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: "" + err,
        },
      ],
    };
  }
}
