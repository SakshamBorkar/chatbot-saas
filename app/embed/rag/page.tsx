import React from "react";
import { getBotConfig } from "@/lib/bots";
import RagChatbot from "@/components/RagChatbot";

type RagEmbedPageProps = {
  searchParams: { botId?: string };
};

export default async function RagEmbedPage({ searchParams }: RagEmbedPageProps) {
  const botId = searchParams.botId ?? "";
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
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; overflow: hidden; }
        `}</style>
      </head>
      <body style={{ height: "100vh" }}>
        <RagChatbot
          botId={config.botId}
          primaryColor={config.primaryColor}
          theme={config.theme}
          botName={config.name}
        />
      </body>
    </html>
  );
}
