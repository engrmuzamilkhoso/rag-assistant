import { pool } from "../src/lib/db.js";
import { answer } from "../src/rag/answer.js";
import { cases } from "./cases.js";

let retrievalPass = 0;
let retrievalTotal = 0;
let answerPass = 0;

for (const c of cases) {
  const { text, chunks } = await answer(c.question);
  const lower = text.toLowerCase();

  // Check 1: is the ANSWER correct?
  const answerOk = c.expectRefusal
    ? lower.includes("don't know")
    : (c.mustContainAny ?? []).some((k) => lower.includes(k.toLowerCase()));
  if (answerOk) answerPass++;

  // Check 2: did SEARCH find the right file?
  let searchNote = "";
  if (c.expectedSource) {
    retrievalTotal++;
    const found = chunks.some((ch) => ch.source === c.expectedSource);
    if (found) retrievalPass++;
    searchNote = found ? "search ✅" : `search ❌ (expected ${c.expectedSource})`;
  }

  console.log(`${answerOk ? "✅" : "❌"} ${c.question}`);
  if (searchNote) console.log(`   ${searchNote}`);
  if (!answerOk) console.log(`   answer: ${text}`);
}

const pct = (a: number, b: number) => `${a}/${b} (${Math.round((a / b) * 100)}%)`;

console.log("\n========== RESULTS ==========");
console.log(`Retrieval: ${pct(retrievalPass, retrievalTotal)}`);
console.log(`Answers:   ${pct(answerPass, cases.length)}`);

await pool.end();
