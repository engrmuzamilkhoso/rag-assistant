import { config } from "../config.js";
import { pool } from "../lib/db.js";
import { embed } from "../lib/ollama.js";

export type Chunk = {
  content: string;
  source: string;
  score: number;
};

/** RETRIEVE: find the chunks most related to the question. */
export async function retrieve(question: string): Promise<Chunk[]> {
  const questionVector = await embed(question);

  const { rows } = await pool.query<Chunk>(
    `SELECT content, source, 1 - (embedding <=> $1::vector) AS score
     FROM documents
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [JSON.stringify(questionVector), config.topK],
  );

  return rows
    .map((r) => ({ ...r, score: Number(r.score) }))
    .filter((r) => r.score >= config.minScore);
}
