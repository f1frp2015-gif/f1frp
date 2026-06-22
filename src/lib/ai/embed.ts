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
    : activeEmbeddingProvider === "zhipu"
      ? { zhipu: { dimensions: EMBED_DIMS } }
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
  // Per-request batch ceiling differs by provider: DashScope text-embedding-v3
  // hard-rejects >10 inputs ("batch size ... should not be larger than 10");
  // Google gemini-embedding-001 handles ~100 (we use 50).
  const CHUNK =
    activeEmbeddingProvider === "dashscope" ? 10 : activeEmbeddingProvider === "zhipu" ? 16 : 50;
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
