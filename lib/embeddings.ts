import { db } from "./db";

/**
 * Find the top-k most relevant chunks for a query using PostgreSQL Full Text Search (FTS).
 */
export async function searchChunks(
  botId: string,
  query: string,
  topK = 5,
  origin?: string
): Promise<{ content: string; url: string; similarity: number }[]> {
  const searchPattern = `%${query}%`;

  if (origin) {
    const results = await db.$queryRaw<
      { content: string; url: string; similarity: number }[]
    >`
      SELECT
        c.content,
        p.url,
        1.0 AS similarity
      FROM chunks c
      JOIN pages p ON p.id = c.page_id
      JOIN websites w ON w.id = p.website_id
      WHERE w.bot_id = ${botId}
        AND w.url = ${origin}
        AND w.status = 'ready'
        AND (
          c.content ILIKE ${searchPattern}
          OR to_tsvector('english', c.content) @@ plainto_tsquery('english', ${query})
        )
      LIMIT ${topK}
    `;
    if (results.length > 0) return results;
  }

  const results = await db.$queryRaw<
    { content: string; url: string; similarity: number }[]
  >`
    SELECT
      c.content,
      p.url,
      1.0 AS similarity
    FROM chunks c
    JOIN pages p ON p.id = c.page_id
    JOIN websites w ON w.id = p.website_id
    WHERE w.bot_id = ${botId}
      AND w.status = 'ready'
      AND (
        c.content ILIKE ${searchPattern}
        OR to_tsvector('english', c.content) @@ plainto_tsquery('english', ${query})
      )
    LIMIT ${topK}
  `;

  return results;
}
