import { embed, embedMany } from "ai";
import {
  getEmbeddingModel,
  EMBED_DIMS,
  activeEmbeddingProvider,
} from "./provider";

// 768 matches pgvector column + stays under HNSW 2000-dim limit.
// Both providers support 768-dim output via Matryoshka truncation:
//   - google gemini-embedding-001 → outputDimensionality
//   - dashscope text-embedding-v3 → dimensions
// providerOptions key must match the provider `name` passed to
// createOpenAICompatible() / createGoogleGenerativeAI() — otherwise the
// option silently drops and you get 1024-dim vectors that don't fit.
type EmbedProviderOptions = Parameters<typeof embed>[0]["providerOptions"];
const providerOptions: EmbedProviderOptions =
  activeEmbeddingProvider === "dashscope"
    ? { dashscope: { dimensions: EMBED_DIMS } }
    : { google: { outputDimensionality: EMBED_DIMS } };

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
