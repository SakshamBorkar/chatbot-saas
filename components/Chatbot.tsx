"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Message from "./Message";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatbotProps = {
  botId: string;
  primaryColor?: string;
  theme?: "light" | "dark";
  botName?: string;
  apiBase?: string;
};

export default function Chatbot({
  botId,
  primaryColor = "#2563eb",
  theme = "light",
  botName = "Assistant",
  apiBase = "",
}: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";



  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId,
          sessionId,
          messages: [...messages, userMsg].map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") break;

          try {
            const { text } = JSON.parse(data);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + text }
                  : m
              )
            );
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, botId, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const bg = isDark ? "#1f2937" : "#ffffff";
  const headerBg = primaryColor;
  const inputBg = isDark ? "#374151" : "#f9fafb";
  const inputBorder = isDark ? "#4b5563" : "#e5e7eb";
  const textColor = isDark ? "#f9fafb" : "#111827";
  const placeholderColor = isDark ? "#9ca3af" : "#6b7280";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: bg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: headerBg,
          color: "#fff",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          💬
        </div>
        <span style={{ fontWeight: 600, fontSize: "15px" }}>{botName}</span>
        {isLoading && (
          <span style={{ marginLeft: "auto", fontSize: "12px", opacity: 0.8 }}>
            Typing…
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: placeholderColor,
              marginTop: "40px",
              fontSize: "14px",
            }}
          >
            👋 Hi! How can I help you today?
          </div>
        )}
        {messages.map((msg) => (
          <Message
            key={msg.id}
            role={msg.role}
            content={msg.content}
            primaryColor={primaryColor}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: `1px solid ${inputBorder}`,
          display: "flex",
          gap: "8px",
          flexShrink: 0,
          backgroundColor: bg,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            border: `1px solid ${inputBorder}`,
            borderRadius: "20px",
            padding: "8px 14px",
            fontSize: "14px",
            backgroundColor: inputBg,
            color: textColor,
            outline: "none",
            lineHeight: "1.5",
            maxHeight: "100px",
            overflow: "auto",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          style={{
            backgroundColor: primaryColor,
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "38px",
            height: "38px",
            cursor: input.trim() && !isLoading ? "pointer" : "default",
            opacity: input.trim() && !isLoading ? 1 : 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            flexShrink: 0,
          }}
          aria-label="Send"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
