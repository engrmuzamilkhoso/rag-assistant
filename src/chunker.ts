export type Chunk = {
  source: string;
  text: string;
};

export function chunkMarkdown(source: string, markdown: string): Chunk[] {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const chunks: Chunk[] = [];
  let heading = "";

  for (const block of blocks) {
    if (block.startsWith("#")) {
      heading = block.replace(/^#+\s*/, "");
      continue;
    }
    chunks.push({ source, text: `${heading}: ${block}` });
  }

  return chunks;
}