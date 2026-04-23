import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const MODEL = "gemini-embedding-001";

// 768 matches pgvector column + stays under HNSW 2000-dim limit; Matryoshka
// truncation on gemini-embedding-001 is safe per model card.
const DIMS = 768;

const providerOptions = {
  google: { outputDimensionality: DIMS },
};

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel(MODEL),
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
      model: google.textEmbeddingModel(MODEL),
      values: slice,
      providerOptions,
    });
    out.push(...(embeddings as number[][]));
  }
  return out;
}
