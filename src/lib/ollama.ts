import { config } from "../config.js";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type EmbedResponse = { embeddings: number[][] };
type ChatResponse = { message: { content: string } };
type ChatStreamPart = { message?: { content: string }; done: boolean };

/** Text → vector (list of numbers that represents its meaning). */
export async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${config.ollamaUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.embedModel, input: text }),
  });
  if (!res.ok) throw new Error(`Embedding failed: ${res.status}`);

  const data = (await res.json()) as EmbedResponse;
  const vector = data.embeddings[0];
  if (!vector) throw new Error("No embedding returned from Ollama");
  return vector;
}

/** Ask the chat model and wait for the full answer. */
export async function chat(messages: Message[]): Promise<string> {
  const res = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.chatModel,
      messages,
      stream: false,
      options: { temperature: 0 },
    }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);

  const data = (await res.json()) as ChatResponse;
  return data.message.content;
}

/** Ask the chat model and get the answer piece by piece, as it is written. */
export async function* chatStream(messages: Message[]): AsyncGenerator<string> {
  const res = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.chatModel,
      messages,
      stream: true,
      options: { temperature: 0 },
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Chat failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep a half-received line for the next read

    for (const line of lines) {
      if (!line.trim()) continue;
      const part = JSON.parse(line) as ChatStreamPart;
      if (part.message?.content) yield part.message.content;
    }
  }
}
