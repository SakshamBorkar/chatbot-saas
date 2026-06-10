import { openai } from "./ai";
import { db } from "./db";

/**
 * Generate an embedding vector for a single text string.
 */
export async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return res.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in one batch call (max 2048 inputs).
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
    encoding_format: "float",
  });

  // API returns results in order
  return res.data.map((d) => d.embedding);
}

/**
 * Convert a number[] embedding to the Postgres vector literal format.
 * e.g. [0.1, 0.2, ...] → '[0.1,0.2,...]'
 */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Find the top-k most relevant chunks for a query using cosine similarity.
 * Uses a raw SQL query because Prisma doesn't support pgvector operators natively.
 */
export async function searchChunks(
  botId: string,
  queryEmbedding: number[],
  topK = 5
): Promise<{ content: string; url: string; similarity: number }[]> {
  const vectorLiteral = toVectorLiteral(queryEmbedding);

  const results = await db.$queryRaw<
    { content: string; url: string; similarity: number }[]
  >`
    SELECT
      c.content,
      p.url,
      1 - (c.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM chunks c
    JOIN pages p ON p.id = c.page_id
    JOIN websites w ON w.id = p.website_id
    WHERE w.bot_id = ${botId}
      AND w.status = 'ready'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `;

  return results;
}
