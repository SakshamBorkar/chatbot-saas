import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bots = [
    { botId: "demo", customerName: "Demo Bot", industry: "general", theme: "light", primaryColor: "#2563eb" },
    { botId: "school001", customerName: "School Assistant", industry: "education", theme: "light", primaryColor: "#16a34a" },
    { botId: "school002", customerName: "University Support", industry: "education", theme: "dark", primaryColor: "#7c3aed" },
    { botId: "pharma001", customerName: "MediCare Pharma", industry: "pharma", theme: "light", primaryColor: "#0891b2" },
    { botId: "build001", customerName: "Apex Infrastructure", industry: "infrastructure", theme: "light", primaryColor: "#ea580c" },
  ];

  for (const bot of bots) {
    await prisma.bot.upsert({
      where: { botId: bot.botId },
      update: bot,
      create: bot,
    });
    console.log(`Seeded bot: ${bot.botId} (${bot.industry})`);
  }

  console.log("\nTo index a website for RAG, POST to /api/crawl:");
  console.log('  { "botId": "school001", "url": "https://your-website.com" }');
  console.log("\nOr use the 'Connect your website' card on /dashboard.");
  console.log('\nThen embed with data-mode="rag" in your script tag.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
