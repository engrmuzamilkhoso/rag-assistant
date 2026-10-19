import { pool } from "./db.js";
import { embed } from "./embed.js";

type SearchResult = {
  content: string;
  score: number;
};

type OllamaChatResponse = {
  message: {
    role: string;
    content: string;
  };
};

const question = "Why is my merchant payout stuck?";

// ============ STEP 1: RETRIEVE (Postgres finds the best lines) ============

const questionVector = await embed(question); // only the QUESTION is embedded now

const { rows: topResults } = await pool.query<SearchResult>(
  `SELECT content, 1 - (embedding <=> $1::vector) AS score
   FROM documents
   ORDER BY embedding <=> $1::vector
   LIMIT 2`,
  [JSON.stringify(questionVector)],
);

console.log(`Question: ${question}\n`);
console.log("Found these lines:");
for (const r of topResults) {
  console.log("  ", Number(r.score).toFixed(3), r.content);
}

// ============ STEP 2: AUGMENT (put found lines into the prompt) ============

const context = topResults.map((r) => "- " + r.content).join("\n");

// ============ STEP 3: GENERATE (AI answers) ============

const res = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama3.2:3b",
    messages: [
      {
        role: "system",
        content: `You are a support assistant for a payment company.
Apply the policy rules to the user's case. Explain in one line.
If no rule in the policy is related to the question, say: "I don't know, please contact support."

POLICY:
${context}`,
      },
      { role: "user", content: question },
    ],
    stream: false,
    options: { temperature: 0 },
  }),
});

const data: OllamaChatResponse = await res.json();
console.log("\nAnswer:", data.message.content);

await pool.end();