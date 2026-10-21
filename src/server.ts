import express from "express";
import { config } from "./config.js";
import { answerStream } from "./rag/answer.js";

const app = express();
app.use(express.json());

app.post("/ask", async (req, res) => {
  const question: unknown = req.body?.question;

  if (typeof question !== "string" || question.trim() === "") {
    res.status(400).json({ error: "question is required" });
    return;
  }

  try {
    const { stream, chunks } = await answerStream(question);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    for await (const piece of stream) {
      res.write(piece);
    }

    const sources = [...new Set(chunks.map((c) => c.source))];
    res.end(sources.length ? `\n\nSources: ${sources.join(", ")}` : "");
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(502).json({ error: "AI service error" });
    else res.end();
  }
});

app.listen(config.port, () => {
  console.log(`RAG API running on http://localhost:${config.port}`);
});
