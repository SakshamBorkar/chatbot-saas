import { NextRequest, NextResponse } from "next/server";
import { getBotConfig } from "@/lib/bots";
import { trackEvent } from "@/lib/analytics";
import { getClientIP } from "@/lib/rate-limit";

type Params = { params: { botId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const { botId } = params;

  if (!botId) {
    return NextResponse.json({ error: "botId is required" }, { status: 400 });
  }

  const config = await getBotConfig(botId);

  if (!config) {
    return NextResponse.json(
      { error: "Bot not found or inactive" },
      { status: 404 }
    );
  }

  // Track widget load
  const ip = getClientIP(req);
  trackEvent({ botId, eventType: "widget_loaded", ipAddress: ip });

  return NextResponse.json(
    {
      botId: config.botId,
      name: config.name,
      theme: config.theme,
      primaryColor: config.primaryColor,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
