import type { ResponseItem } from "openai/resources/responses/responses.mjs";

import { DEEPSEEK_API_URL } from "./config.js";
import OpenAI from "openai";
import { mapToDeepSeekModel } from "./model-utils.js";

/**
 * Generate a compact summary of conversation history with the DeepSeek API.
 * @param items Conversation history items
 * @param model The model to use for summarization
 * @returns A concise summary of the conversation history
 */
export async function generateCompactSummary(
  items: Array<ResponseItem>,
  model: string,
): Promise<string> {
  const oai = new OpenAI({
    apiKey: process.env["DEEPSEEK_API_KEY"],
    baseURL: DEEPSEEK_API_URL,
  });

  // Map model name to DeepSeek equivalent
  const mappedModel = mapToDeepSeekModel(model);

  // Extract text from the items
  const messages = items
    .map((item) => {
      if (
        item.type === "message" &&
        item.content &&
        Array.isArray(item.content)
      ) {
        // Handle standard text content
        const textContent = item.content
          .map((c) => {
            if (
              "type" in c &&
              (c.type === "input_text" || c.type === "output_text") &&
              "text" in c &&
              typeof c.text === "string"
            ) {
              return c.text;
            }
            return null;
          })
          .filter(Boolean)
          .join("\n");

        if (textContent.trim()) {
          return `${item.role}: ${textContent}`;
        }
      }
      return null;
    })
    .filter(Boolean)
    .join("\n\n");

  // Create a summary prompt
  const response = await oai.chat.completions.create({
    model: mappedModel,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes conversation history into a concise form. Extract the main points, key decisions, and current status of the task.",
      },
      {
        role: "user",
        content: `Here is the conversation history, please create a concise summary that captures the key points and current status. Focus on the most important information only:\n\n${messages}`,
      },
    ],
  });

  const summary = response.choices[0]?.message.content || messages;
  return summary;
}
