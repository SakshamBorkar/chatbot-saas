/**
 * GET /api/debug/rag?botId=xxx&q=your+question
 *
 * Full diagnostic snapshot: bot config, crawl status, chunk counts,
 * vector search results, and the current persona cache state.
 *
 * POST /api/debug/rag  { "clearCache": true }  — clears persona cache
 * POST /api/debug/rag  { "industry": "edu" }   — clears cache for one industry
 *
 * ⚠️  Remove or auth-gate this route before going to production.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchChunks } from "@/lib/embeddings";
import { generateIndustryPersona, clearPersonaCache, getPersonaCacheSnapshot } from "@/lib/persona-generator";

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
  const listAll = req.nextUrl.searchParams.get("listAll") === "true";

  if (listAll) {
    const allBots = await db.bot.findMany({
      include: { websites: true },
    });
    return NextResponse.json({ allBots });
  }

  if (!botId) {
    return NextResponse.json({ error: "botId is required" }, { status: 400 });
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

  const [totalChunks, embeddedChunks] = await Promise.all([
    db.$queryRaw<[{ count: string }]>`
    SELECT COUNT(*)::text AS count FROM chunks c
    JOIN pages p ON p.id = c.page_id
    WHERE p.website_id = ANY(${websiteIds}::text[])
  `,
    db.$queryRaw<[{ count: string }]>`
    SELECT COUNT(*)::text AS count FROM chunks c
    JOIN pages p ON p.id = c.page_id
    WHERE p.website_id = ANY(${websiteIds}::text[])
      AND c.embedding IS NOT NULL
  `]);

  // 4. Sample pages stored
  const samplePages = await db.page.findMany({
    where: { websiteId: { in: websiteIds } },
    select: { url: true, content: true },
    take: 5,
  });

  // 5. Run a test vector search
  let vectorResults: unknown[] = [];
  let vectorError: string | null = null;
  try {
    const raw = await searchChunks(botId, query, 5);
    vectorResults = raw.map((r) => ({
      url: r.url,
      similarity: Number(r.similarity).toFixed(4),
      preview: r.content.slice(0, 200),
    }))
  } catch (err) {
    vectorError = String(err);
  }

  let generatedPersona: string | null = null;
  let personaError: string | null = null;
  if (bot?.industry) {
    try {
      generatedPersona = await generateIndustryPersona(bot.industry);
    } catch (err) {
      personaError = String(err);
    }
  }

  return NextResponse.json({
    bot,
    crawlStatus: {
      websites,
      pageCount,
      totalChunks: totalChunks[0]?.count ?? "0",
      chunksWithEmbedding: embeddedChunks[0]?.count ?? "0",
    },
    samplePages: samplePages.map((p) => ({
      url: p.url,
      contentPreview: p.content.slice(0, 300),
      contentLength: p.content.length,
    })),
    vectorSearch: {
      query,
      error: vectorError,
      results: vectorResults,
    },
    personaCache: {
      snapshot: getPersonaCacheSnapshot(),
      generatedForThisBot: generatedPersona,
      error: personaError,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  if (body.clearCache === true) {
    clearPersonaCache();
    return NextResponse.json({ success: true, message: "Full persona cache cleared." });
  }

  if (typeof body.industry === "string") {
    clearPersonaCache(body.industry);
    return NextResponse.json({
      success: true,
      message: `Persona cache cleared for industry="${body.industry}".`,
    });
  }

  return NextResponse.json(
    { error: "Pass { clearCache: true } or { industry: 'key' }" },
    { status: 400 }
  );
}
