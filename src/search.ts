const policy = [
  "Customers can request a refund within 14 days of payment.",
  "Card refunds take 5 to 7 business days.",
  "Wallet refunds (JazzCash, Easypaisa) are instant, up to 24 hours.",
  "Refunds are not allowed during an active chargeback dispute.",
  "Merchants are settled on the next business day (T+1).",
  "Settlements are held if the merchant's KYC documents expire.",
];

type EmbedResponse = {
  embeddings: number[][];
};

async function embed(text: string): Promise<number[]> {
 

  const res = await fetch("http://localhost:11434/api/embed", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "nomic-embed-text",
    input: text,
  }),
});

const data: EmbedResponse = await res.json();
const vector = data.embeddings[0];
if (!vector) {
  throw new Error("No embedding returned from Ollama");
}

return vector;
}

function similarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// const a = await embed("I want my money back");
// const b = await embed("Card refunds take 5 to 7 business days.");
// const c = await embed("Merchants are settled on the next business day.");

// console.log("money back vs refund:     ", similarity(a, b).toFixed(3));
// console.log("money back vs settlement: ", similarity(a, c).toFixed(3));

type SearchResult = {
  text: string;
  score: number;
};

const question = "Why is my merchant payout stuck?";
const questionVector = await embed(question);

const results: SearchResult[] = [];

for (const line of policy) {
  const lineVector = await embed(line);                  
  const score = similarity(questionVector, lineVector);  
  results.push({ text: line, score });                  
}

results.sort((x, y) => y.score - x.score);

// TODO 4: sort results, highest score first
//         hint: results.sort((x, y) => y.score - x.score)

console.log(`Question: ${question}\n`);
for (const r of results) {
  console.log(r.score.toFixed(3), r.text);
}