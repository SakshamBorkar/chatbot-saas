import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { embedText, searchChunks } from "@/lib/embeddings";

/**
 * GET /api/debug/rag?botId=xxx&q=tell+me+about+the+website
 *
 * Returns a full diagnostic snapshot so you can see exactly what the
 * RAG pipeline sees before it hits the LLM.
 *
 * REMOVE or AUTH-GATE this route before going to production.
 */
export async function GET(req: NextRequest) {
  const botId = req.nextUrl.searchParams.get("botId");
  const query = req.nextUrl.searchParams.get("q") ?? "tell me about the website";

  if (!botId) {
    return NextResponse.json({ error: "botId required" }, { status: 400 });
  }

  // 1. Bot config
  const bot = await db.bot.findUnique({
    where: { botId },
    select: { botId: true, customerName: true, industry: true, active: true },
  });

  // 2. Website crawl status
  const websites = await db.website.findMany({
    where: { botId },
    select: { id: true, url: true, status: true, crawledAt: true },
    orderBy: { createdAt: "desc" },
  });

  // 3. Page + chunk counts
  const websiteIds = websites.map((w) => w.id);
  const pageCount = await db.page.count({
    where: { websiteId: { in: websiteIds } },
  });

  const chunkCount = await db.$queryRaw<[{ count: string }]>`
    SELECT COUNT(*)::text AS count FROM chunks c
    JOIN pages p ON p.id = c.page_id
    WHERE p.website_id = ANY(${websiteIds}::uuid[])
  `;

  const chunksWithEmbedding = await db.$queryRaw<[{ count: string }]>`
    SELECT COUNT(*)::text AS count FROM chunks c
    JOIN pages p ON p.id = c.page_id
    WHERE p.website_id = ANY(${websiteIds}::uuid[])
      AND c.embedding IS NOT NULL
  `;

  // 4. Sample pages stored
  const samplePages = await db.page.findMany({
    where: { websiteId: { in: websiteIds } },
    select: { url: true, content: true },
    take: 5,
  });

  // 5. Run a test vector search
  let vectorSearchResults: any[] = [];
  let vectorSearchError: string | null = null;
  try {
    vectorSearchResults = await searchChunks(botId, query, 5);
  } catch (err) {
    vectorSearchError = String(err);
  }

  return NextResponse.json({
    bot,
    crawlStatus: {
      websites,
      pageCount,
      totalChunks: chunkCount[0]?.count ?? "0",
      chunksWithEmbedding: chunksWithEmbedding[0]?.count ?? "0",
    },
    samplePages: samplePages.map((p) => ({
      url: p.url,
      contentPreview: p.content.slice(0, 300),
      contentLength: p.content.length,
    })),
    vectorSearch: {
      query,
      error: vectorSearchError,
      results: vectorSearchResults.map((r) => ({
        url: r.url,
        similarity: r.similarity,
        contentPreview: r.content.slice(0, 200),
      })),
    },
  });
}
