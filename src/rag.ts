// ============ THE DOCUMENTS ============

const policy = [
  "Customers can request a refund within 14 days of payment.",
  "Card refunds take 5 to 7 business days.",
  "Wallet refunds (JazzCash, Easypaisa) are instant, up to 24 hours.",
  "Refunds are not allowed during an active chargeback dispute.",
  "Merchants are settled on the next business day (T+1).",
  "Settlements are held if the merchant's KYC documents expire.",
];

// ============ HELPERS (same as search.ts) ============

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

type SearchResult = {
  text: string;
  score: number;
};

// ============ STEP 1: RETRIEVE (find the best lines) ============

const question = "Do you support crypto payments?";
const questionVector = await embed(question);

const results: SearchResult[] = [];

for (const line of policy) {
  const lineVector = await embed(line);
  const score = similarity(questionVector, lineVector);
  results.push({ text: line, score });
}

results.sort((x, y) => y.score - x.score);

const topResults = results.slice(0, 2); // keep only the best 2

console.log(`Question: ${question}\n`);
console.log("Found these lines:");
for (const r of topResults) {
  console.log("  ", r.score.toFixed(3), r.text);
}

// ============ STEP 2: AUGMENT (put found lines into the prompt) ============

const context = topResults.map((r) => "- " + r.text).join("\n");

// ============ STEP 3: GENERATE (AI answers) ============

type OllamaChatResponse = {
  message: {
    role: string;
    content: string;
  };
};

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
      {
        role: "user",
        content: question,
      },
    ],
    stream: false,
    options: { temperature: 0 },
  }),
});

const data: OllamaChatResponse = await res.json();

console.log("\nAnswer:", data.message.content);