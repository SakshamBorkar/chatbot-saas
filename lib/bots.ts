import { db } from "./db";

export type BotConfig = {
  botId: string;
  name: string;
  primaryColor: string;
};

/**
 * Fetch and validate a bot config.
 * Returns null if the bot doesn't exist or is inactive.
 */
export async function getBotConfig(botId: string): Promise<BotConfig | null> {
  if (!botId || typeof botId !== "string") return null;

  const bot = await db.bot.findUnique({
    where: { botId },
    select: {
      botId: true,
      customerName: true,
      primaryColor: true,
      active: true,
    },
  });

  if (!bot || !bot.active) return null;

  return {
    botId: bot.botId,
    name: bot.customerName,
    primaryColor: bot.primaryColor,
  };
}

/**
 * Create or update a bot configuration.
 */
export async function upsertBot(data: {
  botId: string;
  customerName: string;
  primaryColor?: string;
}) {
  return db.bot.upsert({
    where: { botId: data.botId },
    update: {
      customerName: data.customerName,
      primaryColor: data.primaryColor ?? "#2563eb",
    },
    create: {
      botId: data.botId,
      customerName: data.customerName,
      primaryColor: data.primaryColor ?? "#2563eb",
    },
  });
}
