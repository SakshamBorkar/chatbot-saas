"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  botId: string;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("auth_token");
    if (!stored || !token) {
      router.replace("/login");
      return;
    }
    setUser(JSON.parse(stored));
    setLoading(false);
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading || !user) {
    return (
      <div style={{ ...styles.page, alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b", fontSize: "14px" }}>Loading…</div>
      </div>
    );
  }

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://your-chatbot.vercel.app";

  const basicSnippet = `<script
  src="${baseUrl}/widget.js"
  data-bot-id="${user.botId}"
  async>
</script>`;

  const ragSnippet = `<script
  src="${baseUrl}/widget.js"
  data-bot-id="${user.botId}"
  data-mode="rag"
  async>
</script>`;

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={{ fontSize: "22px" }}>🤖</span>
          <span style={styles.brandName}>BotSaaS</span>
        </div>
        <nav style={styles.nav}>
          {[
            { icon: "⊞", label: "Dashboard", active: true },
            { icon: "📊", label: "Analytics", active: false },
            { icon: "⚙️", label: "Settings", active: false },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...styles.navItem,
                backgroundColor: item.active ? "rgba(37,99,235,0.1)" : "transparent",
                color: item.active ? "#2563eb" : "#64748b",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <button onClick={logout} style={styles.logoutBtn}>
          ↩ Sign out
        </button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>
              Welcome back, {user.name.split(" ")[0]} 👋
            </p>
          </div>
          <div style={styles.avatar}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Bot ID card */}
        <div style={styles.botIdCard}>
          <div style={styles.botIdCardLeft}>
            <div style={styles.botIdLabel}>Your Bot ID</div>
            <div style={styles.botIdValue}>{user.botId}</div>
            <div style={styles.botIdHint}>
              This is your unique identifier — use it in the embed snippet below.
            </div>
          </div>
          <button
            onClick={() => copy(user.botId, "botId")}
            style={styles.copyBtnWhite}
          >
            {copied === "botId" ? "✓ Copied!" : "Copy ID"}
          </button>
        </div>

        {/* Account info */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Account details</h2>
          <div style={styles.infoGrid}>
            {[
              { label: "Name", value: user.name },
              { label: "Email", value: user.email },
              { label: "Phone", value: user.phone },
              {
                label: "Member since",
                value: new Date(user.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                }),
              },
            ].map((item) => (
              <div key={item.label} style={styles.infoItem}>
                <div style={styles.infoLabel}>{item.label}</div>
                <div style={styles.infoValue}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Embed snippets */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Embed your chatbot</h2>
          <p style={styles.sectionDesc}>
            Paste one of these script tags before the closing{" "}
            <code style={styles.code}>&lt;/body&gt;</code> tag on any website.
          </p>

          <SnippetCard
            title="Basic chatbot"
            description="General-purpose AI assistant. No knowledge base required."
            snippet={basicSnippet}
            onCopy={() => copy(basicSnippet, "basic")}
            copied={copied === "basic"}
          />

          <SnippetCard
            title="RAG chatbot (website-aware)"
            description="Answers questions using your website's content. Requires crawling first via /api/crawl."
            snippet={ragSnippet}
            onCopy={() => copy(ragSnippet, "rag")}
            copied={copied === "rag"}
          />
        </div>
      </div>
    </div>
  );
}

function SnippetCard({
  title,
  description,
  snippet,
  onCopy,
  copied,
}: {
  title: string;
  description: string;
  snippet: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div style={snippetStyles.card}>
      <div style={snippetStyles.cardHeader}>
        <div>
          <div style={snippetStyles.cardTitle}>{title}</div>
          <div style={snippetStyles.cardDesc}>{description}</div>
        </div>
        <button
          onClick={onCopy}
          style={{
            ...snippetStyles.copyBtn,
            backgroundColor: copied ? "#16a34a" : "#2563eb",
          }}
        >
          {copied ? "✓ Copied!" : "Copy snippet"}
        </button>
      </div>
      <pre style={snippetStyles.pre}>{snippet}</pre>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: "220px",
    backgroundColor: "#fff",
    borderRight: "1px solid #e2e8f0",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "40px",
    paddingLeft: "8px",
  },
  brandName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
    padding: "8px 12px",
  },
  main: {
    flex: 1,
    padding: "40px 48px",
    overflowY: "auto",
    maxWidth: "860px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
  },
  pageTitle: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 4px",
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "16px",
  },
  botIdCard: {
    backgroundColor: "#2563eb",
    borderRadius: "14px",
    padding: "24px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "32px",
    gap: "16px",
  },
  botIdCardLeft: { display: "flex", flexDirection: "column", gap: "6px" },
  botIdLabel: { fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" },
  botIdValue: { fontSize: "22px", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", fontFamily: "monospace" },
  botIdHint: { fontSize: "13px", color: "rgba(255,255,255,0.6)" },
  copyBtnWhite: {
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "1.5px solid rgba(255,255,255,0.3)",
    borderRadius: "8px",
    padding: "8px 18px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  section: { marginBottom: "36px" },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 16px",
    letterSpacing: "-0.3px",
  },
  sectionDesc: { fontSize: "14px", color: "#64748b", margin: "-8px 0 20px" },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px 24px",
  },
  infoItem: { display: "flex", flexDirection: "column", gap: "4px" },
  infoLabel: { fontSize: "12px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  infoValue: { fontSize: "15px", color: "#0f172a", fontWeight: 500 },
  code: {
    backgroundColor: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#e11d48",
  },
};

const snippetStyles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    gap: "12px",
  },
  cardTitle: { fontSize: "14px", fontWeight: 700, color: "#0f172a" },
  cardDesc: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  copyBtn: {
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    padding: "7px 14px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "background-color 0.2s",
  },
  pre: {
    margin: 0,
    padding: "16px 20px",
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    fontSize: "12.5px",
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    lineHeight: "1.7",
    overflowX: "auto",
  },
};
