// All settings in one place. Change a model or a search setting here, nowhere else.
export const config = {
  databaseUrl: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5433/rag",
  ollamaUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
  chatModel: process.env.CHAT_MODEL ?? "llama3.2:3b",
  embedModel: process.env.EMBED_MODEL ?? "nomic-embed-text",
  port: Number(process.env.PORT ?? 3000),

  docsDir: "docs",
  topK: 4, // how many chunks to fetch from the database
  minScore: 0.6, // ignore chunks less similar than this
};
