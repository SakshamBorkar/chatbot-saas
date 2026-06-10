import { db } from "./db";

export type AnalyticsEvent =
  | "widget_loaded"
  | "widget_opened"
  | "message_sent"
  | "message_received";

export async function trackEvent({
  botId,
  eventType,
  sessionId,
  ipAddress,
}: {
  botId: string;
  eventType: AnalyticsEvent;
  sessionId?: string;
  ipAddress?: string;
}) {
  try {
    await db.analytics.create({
      data: { botId, eventType, sessionId, ipAddress },
    });
  } catch (err) {
    // Analytics failures must never break the main flow
    console.error("[analytics] Failed to track event:", err);
  }
}

export async function getAnalyticsSummary(botId: string) {
  const [total, byType] = await Promise.all([
    db.analytics.count({ where: { botId } }),
    db.analytics.groupBy({
      by: ["eventType"],
      where: { botId },
      _count: { id: true },
    }),
  ]);

  const counts = Object.fromEntries(
    byType.map((r) => [r.eventType, r._count.id])
  );

  return {
    botId,
    total,
    widgetLoaded: counts["widget_loaded"] ?? 0,
    widgetOpened: counts["widget_opened"] ?? 0,
    messageSent: counts["message_sent"] ?? 0,
    messageReceived: counts["message_received"] ?? 0,
  };
}
