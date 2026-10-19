import { pool } from "./db.js";
import { embed } from "./embed.js";

const policy = [
  "Customers can request a refund within 14 days of payment.",
  "Card refunds take 5 to 7 business days.",
  "Wallet refunds (JazzCash, Easypaisa) are instant, up to 24 hours.",
  "Refunds are not allowed during an active chargeback dispute.",
  "Merchants are settled on the next business day (T+1).",
  "Settlements are held if the merchant's KYC documents expire.",
];

// Clear old data, so running this twice doesn't create duplicates
await pool.query("DELETE FROM documents");

for (const line of policy) {
  const vector = await embed(line);

  await pool.query(
    "INSERT INTO documents (content, embedding) VALUES ($1, $2)",
    [line, JSON.stringify(vector)],
  );

  console.log("Saved:", line);
}

console.log(`\nDone. ${policy.length} documents saved.`);

await pool.end(); // close the database connection so the script can exit