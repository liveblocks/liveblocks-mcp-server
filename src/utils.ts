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
