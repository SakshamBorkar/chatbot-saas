import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBotConfig } from "@/lib/bots";
import { streamChatCompletion, checkRateLimit } from "@/lib/ai";
import { trackEvent } from "@/lib/analytics";
import { getClientIP } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { filterMessage } from "@/lib/content-filter";

const ChatRequestSchema = z.object({
  botId: z.string().min(1),
  sessionId: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .min(1)
    .max(50),
});

// Handle preflight CORS
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

  // Rate limit: 50 req/min per IP
  const { allowed, remaining } = checkRateLimit(`chat:${ip}`, 50, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { botId, sessionId, messages } = parsed.data;

  // ── Content filter: check the latest user message ─────────────────────────
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMessage) {
    const filterResult = await filterMessage(lastUserMessage.content);
    if (filterResult.blocked) {
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
          "X-Content-Filtered": "true",
        },
      });
    }
  }

  // Validate bot
  const config = await getBotConfig(botId);
  if (!config) {
    return NextResponse.json(
      { error: "Bot not found or inactive" },
      { status: 404 }
    );
  }

  // Persist conversation + messages (fire-and-forget)
  (async () => {
    try {
      const sid = sessionId ?? crypto.randomUUID();
      const convo = await db.conversation.create({
        data: { botId, sessionId: sid },
      });
      const lastTwo = messages.slice(-2);
      await db.message.createMany({
        data: lastTwo.map((m) => ({
          conversationId: convo.id,
          role: m.role,
          content: m.content,
        })),
      });
    } catch (e) {
      console.error("[chat] Failed to persist messages:", e);
    }
  })();

  // Track analytics (fire-and-forget)
  trackEvent({ botId, eventType: "message_sent", sessionId, ipAddress: ip });

  // Stream AI response
  const stream = await streamChatCompletion(messages, undefined);

  // Track response (best-effort)
  trackEvent({ botId, eventType: "message_received", sessionId });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-RateLimit-Remaining": String(remaining),
    },
  });
}
