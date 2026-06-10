import React from "react";
import WidgetLauncher from "@/components/WidgetLauncher";

export default function ChatPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <p style={{ color: "#6b7280" }}>
        Click the chat button in the bottom right to start a conversation.
      </p>
      <WidgetLauncher botId="demo" />
    </div>
  );
}
