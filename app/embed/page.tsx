import React from "react";
import { getBotConfig } from "@/lib/bots";
import Chatbot from "@/components/Chatbot";

type EmbedPageProps = {
  searchParams: Promise<{ botId?: string; theme?: string; origin?: string }>;
};

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const resolvedSearchParams = await searchParams;
  const botId = resolvedSearchParams.botId ?? "";
  const themeParam = resolvedSearchParams.theme;
  const origin = resolvedSearchParams.origin;

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

  const activeTheme = themeParam === "dark" || themeParam === "light" ? themeParam : config.theme;

  return (
    <div style={{ height: "100vh", width: "100%", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
      ` }} />
      <Chatbot
        botId={config.botId}
        primaryColor={config.primaryColor}
        theme={activeTheme}
        botName={config.name}
        apiBase={process.env.NEXT_PUBLIC_BASE_URL ?? ""}
      />
    </div>
  );
}
