import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "./db.js";
import { embed } from "./embed.js";
import { chunkMarkdown } from "./chunker.js";

const DOCS_DIR = "docs";

const files = readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));

const chunks = files.flatMap((file) =>
  chunkMarkdown(file, readFileSync(join(DOCS_DIR, file), "utf8")),
);

console.log(`Loaded ${files.length} files → ${chunks.length} chunks\n`);

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