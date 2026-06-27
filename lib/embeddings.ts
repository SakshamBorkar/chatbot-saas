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

  let websiteIds: string[] = [];

  if (origin) {
    const websites = await db.website.findMany({
      where: { botId, status: "ready" },
      select: { id: true, url: true },
    });

    const matchingWebsites = websites.filter((w) => {
      try {
        return new URL(w.url).hostname === new URL(origin).hostname;
      } catch {
        const clean = (url: string) => url.replace(/https?:\/\//, "").split("/")[0].split(":")[0];
        return clean(w.url) === clean(origin);
      }
    });

    websiteIds = matchingWebsites.map((w) => w.id);
  }

  if (origin && websiteIds.length === 0) {
    return [];
  }

  if (websiteIds.length > 0) {
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
      WHERE w.id = ANY(${websiteIds})
        AND (
          c.content ILIKE ${searchPattern}
          OR to_tsvector('english', c.content) @@ plainto_tsquery('english', ${query})
        )
      LIMIT ${topK}
    `;
    return results;
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
