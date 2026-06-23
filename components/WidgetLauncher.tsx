"use client";

import React, { useState } from "react";
import Chatbot from "./Chatbot";

type WidgetLauncherProps = {
  botId: string;
  primaryColor?: string;
  theme?: "light" | "dark";
  botName?: string;
};

export default function WidgetLauncher({
  botId,
  primaryColor = "#2563eb",
  theme = "light",
  botName = "Assistant",
}: WidgetLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "24px",
            width: "370px",
            height: "560px",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            zIndex: 9999,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Chatbot
            botId={botId}
            primaryColor={primaryColor}
            theme={theme}
            botName={botName}
          />
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: primaryColor,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.15s ease",
        }}
        onMouseEnter={(e) =>
          ((e.target as HTMLElement).style.transform = "scale(1.1)")
        }
        onMouseLeave={(e) =>
          ((e.target as HTMLElement).style.transform = "scale(1)")
        }
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </>
  );
}
