import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";
import { pool } from "./lib/db.js";
import { embed } from "./lib/ollama.js";
import { chunkMarkdown } from "./rag/chunker.js";

// 1. LOAD every .md file in docs/
const files = readdirSync(config.docsDir).filter((f) => f.endsWith(".md"));

// 2. CHUNK
const chunks = files.flatMap((file) =>
  chunkMarkdown(file, readFileSync(join(config.docsDir, file), "utf8")),
);
console.log(`Loaded ${files.length} files → ${chunks.length} chunks\n`);

// 3. EMBED + 4. SAVE (replace old data so nothing is duplicated)
await pool.query("DELETE FROM documents");

for (const chunk of chunks) {
  const vector = await embed(chunk.text);
  await pool.query(
    "INSERT INTO documents (content, source, embedding) VALUES ($1, $2, $3)",
    [chunk.text, chunk.source, JSON.stringify(vector)],
  );
  console.log(`Saved [${chunk.source}] ${chunk.text.slice(0, 60)}...`);
}

console.log("\nDone.");
await pool.end();
