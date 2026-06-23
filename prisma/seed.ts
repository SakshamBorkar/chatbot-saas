import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bots = [
    {
      botId: "demo",
      customerName: "Demo Bot",
      primaryColor: "#2563eb",
    },
    {
      botId: "school001",
      customerName: "School Assistant",
      primaryColor: "#16a34a",
      industry: "education",
    },
    {
      botId: "school002",
      customerName: "University Support",
      primaryColor: "#7c3aed",
      industry: "education",
    },
  ];

  for (const bot of bots) {
    await prisma.bot.upsert({
      where: { botId: bot.botId },
      update: bot,
      create: bot,
    });
    console.log(`Seeded bot: ${bot.botId}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
