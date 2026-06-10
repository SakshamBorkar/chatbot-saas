"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Message from "./Message";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type RagChatbotProps = {
  botId: string;
  primaryColor?: string;
  theme?: "light" | "dark";
  botName?: string;
};

export default function RagChatbot({
  botId,
  primaryColor = "#2563eb",
  theme = "light",
  botName = "Assistant",
}: RagChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";
  const bg = isDark ? "#1f2937" : "#ffffff";
  const inputBg = isDark ? "#374151" : "#f9fafb";
  const inputBorder = isDark ? "#4b5563" : "#e5e7eb";
  const textColor = isDark ? "#f9fafb" : "#111827";
  const placeholderColor = isDark ? "#9ca3af" : "#6b7280";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setError(null);

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
      const res = await fetch("/api/rag-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({
          botId,
          sessionId,
          messages: [...messages, userMsg].map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      // Handle non-streaming errors (503 = knowledge base not ready, etc.)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          res.status === 503
            ? "Knowledge base is still being prepared. Please try again shortly."
            : res.status === 429
            ? "You're sending messages too quickly. Please slow down."
            : (data.message ?? "Something went wrong. Please try again.");

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: msg } : m
          )
        );
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const { text: token } = JSON.parse(data);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + token }
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
            ? { ...m, content: "Something went wrong. Please try again." }
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
          backgroundColor: primaryColor,
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
          🤖
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "15px" }}>{botName}</div>
          <div style={{ fontSize: "11px", opacity: 0.8 }}>
            Answers questions about this website
          </div>
        </div>
        {isLoading && (
          <div style={{ marginLeft: "auto", fontSize: "12px", opacity: 0.8 }}>
            Thinking…
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: placeholderColor,
              marginTop: "32px",
              fontSize: "14px",
              lineHeight: "1.8",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>👋</div>
            <div>Hi! Ask me anything about this website.</div>
            <div style={{ marginTop: "16px", fontSize: "12px" }}>
              Try: "What services do you offer?" or "How can I contact you?"
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <Message
            key={msg.id}
            role={msg.role}
            content={msg.content || (isLoading ? "▍" : "")}
            primaryColor={primaryColor}
          />
        ))}
        {error && (
          <div
            style={{
              color: "#ef4444",
              fontSize: "12px",
              textAlign: "center",
              marginTop: "8px",
            }}
          >
            {error}
          </div>
        )}
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
          placeholder="Ask a question…"
          rows={1}
          disabled={isLoading}
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
            maxHeight: "80px",
            overflow: "auto",
            opacity: isLoading ? 0.6 : 1,
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
            opacity: input.trim() && !isLoading ? 1 : 0.4,
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

      {/* Powered by */}
      <div
        style={{
          textAlign: "center",
          fontSize: "10px",
          color: placeholderColor,
          padding: "4px 0 8px",
          backgroundColor: bg,
        }}
      >
        Powered by AI · answers based on website content only
      </div>
    </div>
  );
}
