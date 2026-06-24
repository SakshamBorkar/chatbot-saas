import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getBotConfig } from "@/lib/bots";
import { crawlWebsite } from "@/lib/crawler";
import { chunkText } from "@/lib/chunker";
import { embedBatch, toVectorLiteral } from "@/lib/embeddings";

export const maxDuration = 300;

const CrawlRequestSchema = z.object({
  botId: z.string().min(1),
  url: z.string().url(),
});

/**
 * POST /api/crawl
 * Crawl a website and build the vector knowledge base for a bot.
 * This is a long-running operation — in production, move to a background job.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CrawlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { botId, url } = parsed.data;



  // Validate bot
  const config = await getBotConfig(botId);
  if (!config) {
    return NextResponse.json({ error: "Bot not found or inactive" }, { status: 404 });
  }

  // Create or reset website record
  const website = await db.website.upsert({
    where: { botId_url: { botId, url } },
    update: { status: "crawling", crawledAt: null },
    create: { botId, url, status: "crawling" },
  });

  // Delete old pages/chunks for this website (cascade handles chunks)
  await db.page.deleteMany({ where: { websiteId: website.id } });

  try {
    // ── Step 1: Crawl ─────────────────────────────────────────────────────
    const crawledPages = await crawlWebsite(url);

    if (crawledPages.length === 0) {
      await db.website.update({
        where: { id: website.id },
        data: { status: "error" },
      });
      return NextResponse.json({ error: "No pages could be crawled" }, { status: 422 });
    }

    // ── Step 2: Save pages ────────────────────────────────────────────────
    const savedPages = await Promise.all(
      crawledPages.map((p) =>
        db.page.create({
          data: { websiteId: website.id, url: p.url, content: p.content },
        })
      )
    );

    // ── Step 3: Chunk all pages ───────────────────────────────────────────
    const allChunks: { pageId: string; content: string }[] = [];
    for (const page of savedPages) {
      const chunks = chunkText(
        crawledPages.find((p) => p.url === page.url)!.content
      );
      for (const content of chunks) {
        allChunks.push({ pageId: page.id, content });
      }
    }

    // ── Step 4: Embed in batches of 100 ──────────────────────────────────
    const apiKey = process.env.OPENAI_API_KEY;
    const hasApiKey = apiKey && apiKey !== "sk-...";

    const BATCH_SIZE = 100;
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.content);
      const embeddings = hasApiKey ? await embedBatch(texts) : null;

      for (let j = 0; j < batch.length; j++) {
        const vectorLiteral = (embeddings && embeddings[j]) ? toVectorLiteral(embeddings[j]) : null;
        const chunkId = crypto.randomUUID();

        if (vectorLiteral) {
          await db.$executeRaw`
            INSERT INTO chunks (id, page_id, content, embedding, created_at)
            VALUES (
              ${chunkId}::uuid,
              ${batch[j].pageId}::uuid,
              ${batch[j].content},
              ${vectorLiteral}::vector,
              NOW()
            )
          `;
        } else {
          await db.$executeRaw`
            INSERT INTO chunks (id, page_id, content, created_at)
            VALUES (
              ${chunkId}::uuid,
              ${batch[j].pageId}::uuid,
              ${batch[j].content},
              NOW()
            )
          `;
        }
      }
    }

    // ── Step 5: Mark ready ────────────────────────────────────────────────
    await db.website.update({
      where: { id: website.id },
      data: { status: "ready", crawledAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      websiteId: website.id,
      pagesIndexed: savedPages.length,
      chunksIndexed: allChunks.length,
    });
  } catch (err) {
    console.error("[crawl] Pipeline failed:", err);
    await db.website.update({
      where: { id: website.id },
      data: { status: "error" },
    });
    return NextResponse.json(
      { error: "Crawl pipeline failed", details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crawl?botId=xxx — check crawl status
 */
export async function GET(req: NextRequest) {
  const botId = req.nextUrl.searchParams.get("botId");
  if (!botId) {
    return NextResponse.json({ error: "botId required" }, { status: 400 });
  }

  const websites = await db.website.findMany({
    where: { botId },
    select: { id: true, url: true, status: true, crawledAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ websites });
}
