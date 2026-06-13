"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [baseUrl, setBaseUrl] = useState("https://chatbot-saas-self-three.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") {
        setBaseUrl(window.location.origin);
      }
    }
  }, []);

  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={styles.container}>
      {/* CSS Stylesheet Inject for Fonts, Animations and Hover Classes */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #fafbfe;
          color: #1e293b;
        }

        .nav-link {
          color: #475569;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          transition: color 0.2s ease;
        }
        .nav-link:hover {
          color: #2563eb;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .btn-secondary {
          background-color: #ffffff;
          color: #475569;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          border: 1px solid #e2e8f0;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
        }

        .hero-btn-primary {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          padding: 14px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.15);
        }
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
        }

        .hero-btn-secondary {
          background-color: transparent;
          color: #1e293b;
          padding: 14px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          border: 2px solid #e2e8f0;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .hero-btn-secondary:hover {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }

        .feature-card {
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 32px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* Header / Navigation bar */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>🤖</span>
            <span style={styles.brandName}>BotSaaS</span>
          </div>

          <nav style={styles.desktopNav}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#demo-section" onClick={scrollToDemo} className="nav-link">Live Demo</a>
          </nav>

          <div style={styles.authButtons}>
            <Link href="/login" className="nav-link" style={{ marginRight: "8px" }}>
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.glowOverlay} />
        <div style={styles.heroContent}>
          <div style={styles.badge}>⚡ Live Chat Widget for SaaS</div>
          <h1 style={styles.heroTitle}>
            One script tag.<br />
            <span style={styles.gradientText}>Infinite conversations.</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Supercharge your website support. Embed an AI agent in minutes. It automatically crawls your website and answers visitor queries using advanced RAG retrieval.
          </p>
          <div style={styles.heroCTAs}>
            <Link href="/signup" className="hero-btn-primary">
              Get Started Free →
            </Link>
            <a href="#demo-section" onClick={scrollToDemo} className="hero-btn-secondary">
              View Demo
            </a>
          </div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>1 line</div>
            <div style={styles.statLabel}>Of HTML integration code</div>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <div style={styles.statValue}>24/7</div>
            <div style={styles.statLabel}>Autonomous customer support</div>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <div style={styles.statValue}>Instant</div>
            <div style={styles.statLabel}>Knowledge base crawl</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Everything you need to automate support</h2>
          <p style={styles.sectionSubtitle}>Simple to configure, premium appearance, and powered by the latest AI.</p>
        </div>

        <div style={styles.featuresGrid}>
          <div className="feature-card">
            <div style={{ ...styles.featureIcon, backgroundColor: "#eff6ff", color: "#3b82f6" }}>🌐</div>
            <h3 style={styles.featureTitle}>Automatic RAG Crawling</h3>
            <p style={styles.featureDesc}>
              Submit your website URL. The bot crawls the content, extracts knowledge, embeds chunks, and resolves queries directly from your page source.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ ...styles.featureIcon, backgroundColor: "#fef2f2", color: "#ef4444" }}>🎨</div>
            <h3 style={styles.featureTitle}>Brand Customization</h3>
            <p style={styles.featureDesc}>
              Personalize primary colors, bot avatar name, and pick between dark or light themes to match your brand's unique identity.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ ...styles.featureIcon, backgroundColor: "#f5f3ff", color: "#8b5cf6" }}>📊</div>
            <h3 style={styles.featureTitle}>Advanced Analytics</h3>
            <p style={styles.featureDesc}>
              Track click-throughs, chat session length, user interactions, and view full transcript logs in a centralized developer dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section id="how-it-works" style={styles.quickStartSection}>
        <div style={styles.quickStartContent}>
          <div style={styles.quickStartLeft}>
            <h2 style={styles.sectionTitleLeft}>Embed in 3 Simple Steps</h2>
            <div style={styles.stepList}>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>1</div>
                <div>
                  <h4 style={styles.stepTitle}>Create an Account</h4>
                  <p style={styles.stepDesc}>Register with your email to claim your unique bot profile config.</p>
                </div>
              </div>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>2</div>
                <div>
                  <h4 style={styles.stepTitle}>Crawl Your Website</h4>
                  <p style={styles.stepDesc}>Input your domain and wait 60 seconds for the database chunking to complete.</p>
                </div>
              </div>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>3</div>
                <div>
                  <h4 style={styles.stepTitle}>Paste the Snippet</h4>
                  <p style={styles.stepDesc}>Copy the dynamic script tag and place it in the body tag of your website.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.quickStartRight}>
            <div style={styles.codeMockup}>
              <div style={styles.codeHeader}>
                <span style={{ ...styles.codeDot, backgroundColor: "#ef4444" }} />
                <span style={{ ...styles.codeDot, backgroundColor: "#eab308" }} />
                <span style={{ ...styles.codeDot, backgroundColor: "#22c55e" }} />
                <span style={styles.codeTitle}>HTML integration snippet</span>
              </div>
              <pre style={styles.codeBody}>
                {`<script
  src="${baseUrl}/widget.js"
  data-bot-id="demo"
  async>
</script>`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo-section" style={styles.demoSection}>
        <div style={styles.demoBox}>
          <div style={styles.demoLabel}>LIVE PREVIEW</div>
          <h2 style={styles.demoTitle}>Interact with the Demo Agent</h2>
          <p style={styles.demoDesc}>
            Test the live chatbot floating in the bottom-right corner. It is currently configured with database configurations tied to the demo bot. Feel free to ask it questions!
          </p>
          <div style={styles.demoPointer}>
            <span style={styles.pulseIcon}>🔵</span>
            <span>Check out the bubble helper in the bottom-right corner</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div>© {new Date().getFullYear()} BotSaaS. All rights reserved.</div>
          <div style={styles.footerLinks}>
            <a href="#" className="nav-link">Terms</a>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <a href="#" className="nav-link">Privacy</a>
          </div>
        </div>
      </footer>

      {/* Floating widget script injection */}
      {baseUrl !== "https://your-chatbot.vercel.app" && (
        <script
          src={`${baseUrl}/widget.js`}
          data-bot-id="demo"
          async
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #f1f5f9",
    zIndex: 100,
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  brandIcon: {
    fontSize: "24px",
  },
  brandName: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  desktopNav: {
    display: "flex",
    gap: "28px",
    alignItems: "center",
  },
  authButtons: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  heroSection: {
    padding: "160px 24px 80px",
    position: "relative",
    display: "flex",
    justifyContent: "center",
    textAlign: "center",
    background: "radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.05), transparent 60%)",
  },
  glowOverlay: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "300px",
    background: "radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0) 70%)",
    zIndex: -1,
    filter: "blur(40px)",
  },
  heroContent: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    color: "#2563eb",
    padding: "6px 14px",
    borderRadius: "100px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "24px",
  },
  heroTitle: {
    fontSize: "3.5rem",
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: "-1.5px",
    color: "#0f172a",
    margin: "0 auto 20px",
  },
  gradientText: {
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    fontSize: "1.2rem",
    color: "#475569",
    lineHeight: 1.6,
    marginBottom: "36px",
    maxWidth: "640px",
    margin: "0 auto 36px",
  },
  heroCTAs: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    alignItems: "center",
  },
  statsSection: {
    backgroundColor: "#ffffff",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    padding: "36px 24px",
  },
  statsGrid: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "24px",
  },
  statItem: {
    textAlign: "center",
    flex: 1,
    minWidth: "150px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#2563eb",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 500,
  },
  statDivider: {
    width: "1px",
    height: "40px",
    backgroundColor: "#e2e8f0",
  },
  featuresSection: {
    padding: "100px 24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: "60px",
  },
  sectionTitle: {
    fontSize: "2.2rem",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#0f172a",
    marginBottom: "16px",
  },
  sectionSubtitle: {
    fontSize: "1.1rem",
    color: "#64748b",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  featureIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    marginBottom: "24px",
  },
  featureTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "12px",
  },
  featureDesc: {
    fontSize: "14.5px",
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0,
  },
  quickStartSection: {
    backgroundColor: "#f8fafc",
    padding: "100px 24px",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
  },
  quickStartContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    gap: "60px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  quickStartLeft: {
    flex: 1,
    minWidth: "300px",
  },
  sectionTitleLeft: {
    fontSize: "2.2rem",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#0f172a",
    marginBottom: "40px",
  },
  stepList: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  stepItem: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "15px",
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 6px",
  },
  stepDesc: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
    margin: 0,
  },
  quickStartRight: {
    flex: 1,
    minWidth: "320px",
  },
  codeMockup: {
    backgroundColor: "#0f172a",
    borderRadius: "14px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    overflow: "hidden",
  },
  codeHeader: {
    display: "flex",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid #1e293b",
    gap: "6px",
  },
  codeDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  codeTitle: {
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: 500,
    marginLeft: "10px",
  },
  codeBody: {
    margin: 0,
    padding: "24px 20px",
    color: "#38bdf8",
    fontSize: "14px",
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    lineHeight: "1.7",
    overflowX: "auto",
  },
  demoSection: {
    padding: "100px 24px",
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
  },
  demoBox: {
    background: "#ffffff",
    border: "1.5px dashed #cbd5e1",
    borderRadius: "20px",
    padding: "48px 32px",
  },
  demoLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#2563eb",
    letterSpacing: "0.1em",
    marginBottom: "16px",
  },
  demoTitle: {
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "16px",
  },
  demoDesc: {
    fontSize: "15px",
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: "28px",
    maxWidth: "580px",
    margin: "0 auto 28px",
  },
  demoPointer: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#eff6ff",
    padding: "10px 18px",
    borderRadius: "100px",
    fontSize: "13.5px",
    color: "#1e40af",
    fontWeight: 600,
  },
  pulseIcon: {
    animation: "pulse 2s infinite",
  },
  footer: {
    backgroundColor: "#ffffff",
    borderTop: "1px solid #f1f5f9",
    marginTop: "auto",
    padding: "28px 24px",
  },
  footerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13.5px",
    color: "#94a3b8",
    flexWrap: "wrap",
    gap: "12px",
  },
  footerLinks: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
};
