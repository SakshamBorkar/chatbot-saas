import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent, getAnalyticsSummary } from "@/lib/analytics";
import { getBotConfig } from "@/lib/bots";

const TrackEventSchema = z.object({
  botId: z.string().min(1),
  eventType: z.enum([
    "widget_loaded",
    "widget_opened",
    "message_sent",
    "message_received",
  ]),
  sessionId: z.string().optional(),
});

// POST /api/analytics — track an event from the widget
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TrackEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const { botId, eventType, sessionId } = parsed.data;

  // Validate bot exists (silently ignore invalid bots to avoid leaking info)
  const config = await getBotConfig(botId);
  if (!config) {
    return NextResponse.json({ ok: true }); // silent no-op
  }

  await trackEvent({ botId, eventType, sessionId });

  return NextResponse.json(
    { ok: true },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}

// GET /api/analytics?botId=xxx — return summary stats
export async function GET(req: NextRequest) {
  const botId = req.nextUrl.searchParams.get("botId");
  if (!botId) {
    return NextResponse.json({ error: "botId is required" }, { status: 400 });
  }

  const config = await getBotConfig(botId);
  if (!config) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  const summary = await getAnalyticsSummary(botId);
  return NextResponse.json(summary);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
