import type { Message } from "../lib/ollama.js";
import type { Chunk } from "./retrieve.js";

export const REFUSAL = "I don't know, please contact support.";

/** AUGMENT: put the found chunks into the prompt. The only place the prompt lives. */
export function buildMessages(question: string, chunks: Chunk[]): Message[] {
  const context = chunks.map((c) => `- [${c.source}] ${c.content}`).join("\n");

  return [
    {
      role: "system",
      content: `You are a support assistant for a payment company.
Answer using ONLY the documents below. Keep the answer short.
The user may use different words than the documents (for example "stuck" may mean "held"). Match their situation to the closest rule.
If a document describes a possible reason for the user's problem, explain that reason.
If the documents only answer part of the question, say what is missing.
If nothing in the documents is related to the question, say: "${REFUSAL}"

DOCUMENTS:
${context}`,
    },
    { role: "user", content: question },
  ];
}
