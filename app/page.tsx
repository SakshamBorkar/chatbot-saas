import React from "react";

export default function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://your-chatbot.vercel.app";

  return (
    <main
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: "800px",
        margin: "0 auto",
        padding: "60px 24px",
        color: "#111827",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "12px" }}>
        🤖 Embeddable Chatbot SaaS
      </h1>
      <p style={{ fontSize: "1.1rem", color: "#4b5563", marginBottom: "40px" }}>
        Add an AI-powered chat widget to any website with a single script tag.
      </p>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>Quick Start</h2>
        <pre
          style={{
            background: "#1e293b",
            color: "#e2e8f0",
            padding: "20px",
            borderRadius: "10px",
            overflowX: "auto",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          {`<script
  src="${baseUrl}/widget.js"
  data-bot-id="your-bot-id"
  async>
</script>`}
        </pre>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>How it works</h2>
        <ol style={{ color: "#4b5563", lineHeight: "2" }}>
          <li>Add the script tag to your website</li>
          <li>A floating chat button appears automatically</li>
          <li>Visitors click the button to open the chat widget</li>
          <li>The chatbot loads in a secure iframe — no extra setup needed</li>
        </ol>
      </section>

      <section>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>Demo</h2>
        <p style={{ color: "#4b5563" }}>
          Try the live demo — a floating chat button should appear in the
          bottom-right corner of this page.
        </p>
        <script
          src={`${baseUrl}/widget.js`}
          data-bot-id="demo"
          async
        />
      </section>
    </main>
  );
}
