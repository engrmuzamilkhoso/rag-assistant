export type DocChunk = {
  source: string; // file name, e.g. "refunds.md"
  text: string;
};

/** Split markdown into paragraph chunks, each prefixed with its section heading. */
export function chunkMarkdown(source: string, markdown: string): DocChunk[] {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const chunks: DocChunk[] = [];
  let heading = "";

  for (const block of blocks) {
    if (block.startsWith("#")) {
      heading = block.replace(/^#+\s*/, "");
      continue;
    }
    chunks.push({ source, text: heading ? `${heading}: ${block}` : block });
  }

  return chunks;
}
