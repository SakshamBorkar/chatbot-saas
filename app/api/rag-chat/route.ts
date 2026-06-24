import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBotConfig } from "@/lib/bots";
import { ragStream, hasReadyKnowledgeBase } from "@/lib/rag";
import { trackEvent } from "@/lib/analytics";
import { checkRateLimit } from "@/lib/ai";
import { getClientIP } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { filterMessage } from "@/lib/content-filter";

const RagChatSchema = z.object({
  botId: z.string().min(1),
  sessionId: z.string().optional(),
  origin: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .min(1)
    .max(20),
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  // Rate limit: 20 req/min per session (per spec)
  const sessionKey = req.headers.get("x-session-id") ?? ip;
  const { allowed } = checkRateLimit(`rag:${sessionKey}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RagChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { botId, sessionId, origin, messages } = parsed.data;

    // ── Content filter: check the latest user message ─────────────────────────
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMessage) {
    const filterResult = await filterMessage(lastUserMessage.content);
    if (filterResult.blocked) {
      // Return a clean SSE stream with the blocked message so the
      // frontend handles it identically to a normal response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: filterResult.message })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new NextResponse(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Filtered": "true", // useful for logging
        },
      });
    }
  }

  // Validate bot
  const config = await getBotConfig(botId);
  if (!config) {
    return NextResponse.json({ error: "Bot not found or inactive" }, { status: 404 });
  }

  // Check knowledge base is ready
  const ready = await hasReadyKnowledgeBase(botId, origin);
  if (!ready) {
    return NextResponse.json(
      {
        error: "knowledge_base_not_ready",
        message: "Knowledge base is still being prepared. Please try again later.",
      },
      { status: 503 }
    );
  }

  // Persist conversation (fire-and-forget)
  const sid = sessionId ?? crypto.randomUUID();
  ;(async () => {
    try {
      const convo = await db.conversation.create({ data: { botId, sessionId: sid } });
      const last = messages.slice(-2);
      await db.message.createMany({
        data: last.map((m) => ({
          conversationId: convo.id,
          role: m.role,
          content: m.content,
        })),
      });
    } catch (e) {
      console.error("[rag-chat] persist error:", e);
    }
  })();

  trackEvent({ botId, eventType: "message_sent", sessionId: sid, ipAddress: ip });

  // Run RAG pipeline
  const { stream } = await ragStream(botId, messages, origin);

  trackEvent({ botId, eventType: "message_received", sessionId: sid });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
