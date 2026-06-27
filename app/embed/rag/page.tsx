import React from "react";
import { getBotConfig } from "@/lib/bots";
import RagChatbot from "@/components/RagChatbot";

type RagEmbedPageProps = {
  searchParams: Promise<{ botId?: string; theme?: string; origin?: string }>;
};

export default async function RagEmbedPage({ searchParams }: RagEmbedPageProps) {
  const resolvedSearchParams = await searchParams;
  const botId = resolvedSearchParams.botId ?? "";
  const themeParam = resolvedSearchParams.theme;
  const origin = resolvedSearchParams.origin;
  const config = await getBotConfig(botId);

  if (!config) {
    return (
      <html lang="en">
        <body
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
            color: "#6b7280",
            fontSize: "14px",
            margin: 0,
          }}
        >
          Bot not found or inactive.
        </body>
      </html>
    );
  }

  const activeTheme = themeParam === "dark" || themeParam === "light" ? themeParam : config.theme;

  return (
    <div style={{ height: "100vh", width: "100%", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
      ` }} />
      <RagChatbot
        botId={config.botId}
        primaryColor={config.primaryColor}
        theme={activeTheme}
        botName={config.name}
        apiBase={process.env.NEXT_PUBLIC_BASE_URL ?? ""}
        origin={origin}
        industry={config.industry}
      />
    </div>
  );
}
