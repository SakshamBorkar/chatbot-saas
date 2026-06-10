"use client";

import React from "react";

export type MessageProps = {
  role: "user" | "assistant";
  content: string;
  primaryColor?: string;
};

export default function Message({ role, content, primaryColor = "#2563eb" }: MessageProps) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          backgroundColor: isUser ? primaryColor : "#f3f4f6",
          color: isUser ? "#fff" : "#111827",
          fontSize: "14px",
          lineHeight: "1.5",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>
    </div>
  );
}
