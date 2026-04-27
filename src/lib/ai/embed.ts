import { embed, embedMany } from "ai";
import { getEmbeddingModel, EMBED_DIMS } from "./provider";

// 768 matches pgvector column + stays under HNSW 2000-dim limit; Matryoshka
// truncation on gemini-embedding-001 is safe per model card.
const providerOptions = {
  google: { outputDimensionality: EMBED_DIMS },
};

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text,
    providerOptions,
  });
  return embedding as number[];
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // Google TEI: keep batch modest — gemini-embedding-001 allows 100/req.
  const CHUNK = 50;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += CHUNK) {
    const slice = texts.slice(i, i + CHUNK);
    const { embeddings } = await embedMany({
      model: getEmbeddingModel(),
      values: slice,
      providerOptions,
    });
    out.push(...(embeddings as number[][]));
  }
  return out;
}
