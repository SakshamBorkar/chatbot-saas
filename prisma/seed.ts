import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bots = [
    {
      botId: "demo",
      customerName: "Demo Bot",
      theme: "light",
      primaryColor: "#2563eb",
    },
    {
      botId: "school001",
      customerName: "School Assistant",
      theme: "light",
      primaryColor: "#16a34a",
    },
    {
      botId: "school002",
      customerName: "University Support",
      theme: "dark",
      primaryColor: "#7c3aed",
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
