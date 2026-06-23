"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { themeColors } from "@/lib/theme";

type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  industry: string;
  botId: string;
  createdAt: string;
};

type WebsiteStatus = {
  id: string;
  url: string;
  status: "pending" | "crawling" | "ready" | "error";
  crawledAt: string | null;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Website / knowledge-base crawling state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websites, setWebsites] = useState<WebsiteStatus[]>([]);
  const [crawlError, setCrawlError] = useState("");
  const [crawling, setCrawling] = useState(false);

  const colors = themeColors.light;

  useEffect(() => {
    // Verify session via cookie-based /api/auth/me
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // Fetch existing crawl status for this bot
  const fetchWebsites = async (botId: string) => {
    try {
      const res = await fetch(`/api/crawl?botId=${encodeURIComponent(botId)}`);
      if (res.ok) {
        const data = await res.json();
        setWebsites(data.websites ?? []);
      }
    } catch {
      // silent — non-critical
    }
  };

  useEffect(() => {
    if (user) fetchWebsites(user.botId);
  }, [user]);

  // Poll while a crawl is in progress
  useEffect(() => {
    const hasActiveCrawl = websites.some(
      (w) => w.status === "pending" || w.status === "crawling"
    );
    if (!hasActiveCrawl || !user) return;

    const interval = setInterval(() => fetchWebsites(user.botId), 3000);
    return () => clearInterval(interval);
  }, [websites, user]);

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !websiteUrl.trim()) return;

    setCrawlError("");
    setCrawling(true);

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: user.botId, url: websiteUrl.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCrawlError(data.error ?? "Failed to start crawl.");
        return;
      }

      setWebsiteUrl("");
      await fetchWebsites(user.botId);
    } catch {
      setCrawlError("Network error. Please try again.");
    } finally {
      setCrawling(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ ...getStyles(colors).page, alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: colors.textSecondary, fontSize: "14px" }}>Loading…</div>
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

  const pageStyles = getStyles(colors);

  return (
    <div style={pageStyles.page}>
      {/* Sidebar */}
      <div style={pageStyles.sidebar}>
        <div style={pageStyles.brand}>
          <span style={{ fontSize: "22px" }}>🤖</span>
          <span style={pageStyles.brandName}>BotSaaS</span>
        </div>
        <nav style={pageStyles.nav}>
          {[
            { icon: "⊞", label: "Dashboard", active: true },
            { icon: "📊", label: "Analytics", active: false },
            { icon: "⚙️", label: "Settings", active: false },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...pageStyles.navItem,
                backgroundColor: item.active ? `${colors.primary}15` : "transparent",
                color: item.active ? colors.primary : colors.textSecondary,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <button onClick={logout} style={pageStyles.logoutBtn}>
          ↩ Sign out
        </button>
      </div>

      {/* Main */}
      <div style={pageStyles.main}>
        {/* Header */}
        <div style={pageStyles.header}>
          <div>
            <h1 style={pageStyles.pageTitle}>Dashboard</h1>
            <p style={pageStyles.pageSubtitle}>
              Welcome back, {user.name.split(" ")[0]} 👋
            </p>
          </div>
          <div style={pageStyles.avatar}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Bot ID card */}
        <div style={pageStyles.botIdCard}>
          <div style={pageStyles.botIdCardLeft}>
            <div style={pageStyles.botIdLabel}>Your Bot ID</div>
            <div style={pageStyles.botIdValue}>{user.botId}</div>
            <div style={pageStyles.botIdHint}>
              This is your unique identifier — use it in the embed snippet below.
            </div>
          </div>
          <button
            onClick={() => copy(user.botId, "botId")}
            style={pageStyles.copyBtnWhite}
          >
            {copied === "botId" ? "✓ Copied!" : "Copy ID"}
          </button>
        </div>

        {/* Connect website / knowledge base */}
        <div style={pageStyles.section}>
          <h2 style={pageStyles.sectionTitle}>Connect your website</h2>
          <p style={pageStyles.sectionDesc}>
            Crawl your website so the RAG chatbot can answer questions using your own content.
            This powers the <code style={pageStyles.code}>data-mode="rag"</code> embed snippet below.
          </p>

          <form onSubmit={handleCrawl} style={pageStyles.crawlForm}>
            <input
              type="url"
              placeholder="https://your-website.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              required
              style={pageStyles.crawlInput}
            />
            <button
              type="submit"
              disabled={crawling}
              style={{ ...pageStyles.crawlBtn, opacity: crawling ? 0.7 : 1 }}
            >
              {crawling ? "Starting…" : "Crawl website"}
            </button>
          </form>
          {crawlError && <div style={pageStyles.errorBox}>{crawlError}</div>}

          {websites.length > 0 && (
            <div style={pageStyles.websiteList}>
              {websites.map((w) => (
                <div key={w.id} style={pageStyles.websiteRow}>
                  <div style={{ minWidth: 0 }}>
                    <div style={pageStyles.websiteUrl}>{w.url}</div>
                    <div style={pageStyles.websiteMeta}>
                      {w.status === "ready" && w.crawledAt
                        ? `Indexed ${new Date(w.crawledAt).toLocaleString()}`
                        : w.status === "crawling"
                        ? "Crawling in progress…"
                        : w.status === "error"
                        ? "Crawl failed — try again"
                        : "Queued…"}
                    </div>
                  </div>
                  <StatusBadge status={w.status} colors={colors} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account info */}
        <div style={pageStyles.section}>
          <h2 style={pageStyles.sectionTitle}>Account details</h2>
          <div style={pageStyles.infoGrid}>
            {[
              { label: "Name", value: user.name },
              { label: "Email", value: user.email },
              { label: "Phone", value: user.phone },
              { label: "Industry", value: industryLabel(user.industry) },
              {
                label: "Member since",
                value: new Date(user.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                }),
              },
            ].map((item) => (
              <div key={item.label} style={pageStyles.infoItem}>
                <div style={pageStyles.infoLabel}>{item.label}</div>
                <div style={pageStyles.infoValue}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Embed snippets */}
        <div style={pageStyles.section}>
          <h2 style={pageStyles.sectionTitle}>Embed your chatbot</h2>
          <p style={pageStyles.sectionDesc}>
            Paste one of these script tags before the closing{" "}
            <code style={pageStyles.code}>&lt;/body&gt;</code> tag on any website.
          </p>

          <SnippetCard
            title="Basic chatbot"
            description="General-purpose AI assistant. No knowledge base required."
            snippet={basicSnippet}
            onCopy={() => copy(basicSnippet, "basic")}
            copied={copied === "basic"}
            colors={colors}
          />

          <SnippetCard
            title="RAG chatbot (website-aware)"
            description={
              websites.some((w) => w.status === "ready")
                ? `Answers questions using your crawled website content. ${websites.filter((w) => w.status === "ready").length} site(s) indexed.`
                : "⚠️ No website indexed yet — crawl your site above first, then paste this snippet."
            }
            snippet={ragSnippet}
            onCopy={() => copy(ragSnippet, "rag")}
            copied={copied === "rag"}
            colors={colors}
          />
        </div>
      </div>
    </div>
  );
}

const INDUSTRY_LABELS: Record<string, string> = {
  pharma: "💊 Pharma & Healthcare",
  education: "🎓 Education",
  infrastructure: "🏗️ Infrastructure & Construction",
  retail: "🛍️ Retail & E-commerce",
  finance: "🏦 Finance & Banking",
  general: "🏢 Other / General Business",
};

function industryLabel(key: string): string {
  return INDUSTRY_LABELS[key] ?? key;
}

function StatusBadge({ status, colors }: { status: WebsiteStatus["status"]; colors: typeof themeColors.light }) {
  const map: Record<WebsiteStatus["status"], { bg: string; color: string; label: string }> = {
    ready: { bg: `${colors.success}15`, color: colors.success, label: "✓ Ready" },
    crawling: { bg: "#fef9c3", color: "#ca8a04", label: "⏳ Crawling" },
    pending: { bg: "#e0e7ff", color: "#4f46e5", label: "Queued" },
    error: { bg: `${colors.error}15`, color: colors.error, label: "✗ Error" },
  };
  const s = map[status];
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        fontSize: "11px",
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: "999px",
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  );
}

function SnippetCard({
  title,
  description,
  snippet,
  onCopy,
  copied,
  colors,
}: {
  title: string;
  description: string;
  snippet: string;
  onCopy: () => void;
  copied: boolean;
  colors: typeof themeColors.light;
}) {
  return (
    <div style={getSnippetStyles(colors).card}>
      <div style={getSnippetStyles(colors).cardHeader}>
        <div>
          <div style={getSnippetStyles(colors).cardTitle}>{title}</div>
          <div style={getSnippetStyles(colors).cardDesc}>{description}</div>
        </div>
        <button
          onClick={onCopy}
          style={{
            ...getSnippetStyles(colors).copyBtn,
            backgroundColor: copied ? "#16a34a" : colors.primary,
          }}
        >
          {copied ? "✓ Copied!" : "Copy snippet"}
        </button>
      </div>
      <pre style={getSnippetStyles(colors).pre}>{snippet}</pre>
    </div>
  );
}

function getStyles(colors: typeof themeColors.light) {
  return {
    page: {
      display: "flex" as const,
      minHeight: "100vh" as const,
      backgroundColor: colors.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' as const,
    },
    sidebar: {
      width: "220px" as const,
      backgroundColor: colors.bgSecondary,
      borderRight: `1px solid ${colors.border}`,
      padding: "24px 16px",
      display: "flex" as const,
      flexDirection: "column" as const,
      flexShrink: 0,
    },
    brand: {
      display: "flex" as const,
      alignItems: "center" as const,
      gap: "8px",
      marginBottom: "40px",
      paddingLeft: "8px",
    },
    brandName: {
      fontSize: "18px",
      fontWeight: 700,
      color: colors.text,
      letterSpacing: "-0.5px",
    },
    nav: {
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: "4px",
      flex: 1,
    },
    navItem: {
      display: "flex" as const,
      alignItems: "center" as const,
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
      color: colors.textSecondary,
      fontSize: "13px",
      cursor: "pointer",
      textAlign: "left" as const,
      padding: "8px 12px",
    },
    main: {
      flex: 1,
      padding: "40px 48px",
      overflowY: "auto" as const,
      maxWidth: "860px",
    },
    header: {
      display: "flex" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
      marginBottom: "32px",
    },
    pageTitle: {
      fontSize: "26px",
      fontWeight: 700,
      color: colors.text,
      margin: "0 0 4px",
      letterSpacing: "-0.5px",
    },
    pageSubtitle: {
      fontSize: "14px",
      color: colors.textSecondary,
      margin: 0,
    },
    avatar: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: colors.primary,
      color: "#fff",
      display: "flex" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      fontWeight: 700,
      fontSize: "16px",
    },
    botIdCard: {
      backgroundColor: colors.primary,
      borderRadius: "14px",
      padding: "24px 28px",
      display: "flex" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      marginBottom: "32px",
      gap: "16px",
    },
    botIdCardLeft: { display: "flex" as const, flexDirection: "column" as const, gap: "6px" },
    botIdLabel: { fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const },
    botIdValue: { fontSize: "22px", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", fontFamily: "monospace" as const },
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
      whiteSpace: "nowrap" as const,
      flexShrink: 0,
    },
    section: { marginBottom: "36px" },
    sectionTitle: {
      fontSize: "17px",
      fontWeight: 700,
      color: colors.text,
      margin: "0 0 16px",
      letterSpacing: "-0.3px",
    },
    sectionDesc: { fontSize: "14px", color: colors.textSecondary, margin: "-8px 0 20px" },
    infoGrid: {
      display: "grid" as const,
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
      backgroundColor: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      padding: "20px 24px",
    },
    infoItem: { display: "flex" as const, flexDirection: "column" as const, gap: "4px" },
    infoLabel: { fontSize: "12px", color: colors.textSecondary, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
    infoValue: { fontSize: "15px", color: colors.text, fontWeight: 500 },
    code: {
      backgroundColor: colors.border,
      padding: "2px 6px",
      borderRadius: "4px",
      fontFamily: "monospace",
      fontSize: "13px",
      color: colors.error,
    },
    crawlForm: {
      display: "flex" as const,
      gap: "10px",
      marginBottom: "8px",
    },
    crawlInput: {
      flex: 1,
      padding: "10px 14px",
      borderRadius: "8px",
      border: `1.5px solid ${colors.border}`,
      fontSize: "14px",
      color: colors.text,
      backgroundColor: colors.bgSecondary,
      outline: "none",
    },
    crawlBtn: {
      padding: "10px 20px",
      borderRadius: "8px",
      backgroundColor: colors.primary,
      color: "#fff",
      fontSize: "14px",
      fontWeight: 600,
      border: "none",
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
      flexShrink: 0,
    },
    errorBox: {
      backgroundColor: `${colors.error}10`,
      border: `1px solid ${colors.error}30`,
      color: colors.error,
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "13px",
      marginTop: "8px",
    },
    websiteList: {
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: "8px",
      marginTop: "16px",
    },
    websiteRow: {
      display: "flex" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      backgroundColor: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: "10px",
      padding: "12px 16px",
      gap: "12px",
    },
    websiteUrl: {
      fontSize: "13px",
      fontWeight: 600,
      color: colors.text,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap" as const,
    },
    websiteMeta: {
      fontSize: "11.5px",
      color: colors.textSecondary,
      marginTop: "2px",
    },
  };
}

function getSnippetStyles(colors: typeof themeColors.light) {
  return {
    card: {
      backgroundColor: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      overflow: "hidden" as const,
      marginBottom: "16px",
    },
    cardHeader: {
      display: "flex" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      padding: "16px 20px",
      borderBottom: `1px solid ${colors.border}`,
      gap: "12px",
    },
    cardTitle: { fontSize: "14px", fontWeight: 700, color: colors.text },
    cardDesc: { fontSize: "12px", color: colors.textSecondary, marginTop: "2px" },
    copyBtn: {
      color: "#fff",
      border: "none",
      borderRadius: "7px",
      padding: "7px 14px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
      flexShrink: 0,
      transition: "background-color 0.2s",
    },
    pre: {
      margin: 0,
      padding: "16px 20px",
      backgroundColor: colors.bgSecondary === "#fff" ? "#1e293b" : "#0f172a",
      color: colors.bgSecondary === "#fff" ? "#e2e8f0" : "#e2e8f0",
      fontSize: "12.5px",
      fontFamily: "'Fira Code', 'Cascadia Code', monospace",
      lineHeight: "1.7",
      overflowX: "auto" as const,
    },
  };
}
