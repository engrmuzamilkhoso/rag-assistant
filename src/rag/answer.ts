import { chat, chatStream } from "../lib/ollama.js";
import { buildMessages, REFUSAL } from "./prompt.js";
import { retrieve, type Chunk } from "./retrieve.js";

/** Full RAG, returns the complete answer. Used by evals. */
export async function answer(question: string): Promise<{ text: string; chunks: Chunk[] }> {
  const chunks = await retrieve(question);
  if (chunks.length === 0) return { text: REFUSAL, chunks };

  const text = await chat(buildMessages(question, chunks));
  return { text, chunks };
}

/** Full RAG, streams the answer piece by piece. Used by the API. */
export async function answerStream(
  question: string,
): Promise<{ stream: AsyncGenerator<string>; chunks: Chunk[] }> {
  const chunks = await retrieve(question);
  if (chunks.length === 0) return { stream: single(REFUSAL), chunks };

  return { stream: chatStream(buildMessages(question, chunks)), chunks };
}

async function* single(text: string): AsyncGenerator<string> {
  yield text;
}
