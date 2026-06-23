import React from "react";
import { getBotConfig } from "@/lib/bots";
import Chatbot from "@/components/Chatbot";

type EmbedPageProps = {
  searchParams: Promise<{ botId?: string }>;
};

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const resolvedSearchParams = await searchParams;
  const botId = resolvedSearchParams.botId ?? "";

  const config = await getBotConfig(botId);

  if (!config) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Bot not found or inactive.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <Chatbot
        botId={config.botId}
        primaryColor={config.primaryColor}
        botName={config.name}
      />
    </div>
  );
}
