"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name:"",
        phone:"",
        email:"",
        password:"",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      // Save token in localStorage for client-side use
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.left}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🤖</span>
          <span style={styles.brandName}>BotSaaS</span>
        </div>
        <div style={styles.leftContent}>
          <h2 style={styles.tagline}>
            One script tag.<br />Infinite conversations.
          </h2>
          <p style={styles.taglineSub}>
            Sign up and get your unique chatbot ID in seconds. Paste it into any website — done.
          </p>
          <div style={styles.featureList}>
            {[
              "Auto-generated bot ID tied to your account",
              "RAG-powered answers from your website",
              "Embeds on any site with one line of code",
            ].map((f) => (
              <div key={f} style={styles.feature}>
                <span style={styles.featureDot} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h1 style={styles.title}>Create your account</h1>
          <p style={styles.subtitle}>
            Already have an account?{" "}
            <a href="/login" style={styles.link}>Sign in</a>
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <Field
              label="Full name"
              type="text"
              placeholder="Rahul Sharma"
              value={form.name}
              onChange={(v) => update("name", v)}
              required
            />
            <Field
              label="Phone number"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              required
            />
            <Field
              label="Email address"
              type="email"
              placeholder="rahul@example.com"
              value={form.email}
              onChange={(v) => update("email", v)}
              required
            />
            <div style={{ position: "relative" }}>
              <Field
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(v) => update("password", v)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={styles.eyeBtn}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <p style={styles.legal}>
            By signing up you agree to our{" "}
            <a href="#" style={styles.link}>Terms</a> and{" "}
            <a href="#" style={styles.link}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...styles.input,
          borderColor: focused ? "#2563eb" : "#e2e8f0",
          boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
        }}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: "#f8fafc",
  },
  left: {
    width: "44%",
    backgroundColor: "#1e293b",
    padding: "48px",
    display: "flex",
    flexDirection: "column",
    gap: "auto",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "64px",
  },
  brandIcon: { fontSize: "28px" },
  brandName: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: "-0.5px",
  },
  leftContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "24px",
  },
  tagline: {
    fontSize: "36px",
    fontWeight: 700,
    color: "#f8fafc",
    lineHeight: 1.2,
    letterSpacing: "-1px",
    margin: 0,
  },
  taglineSub: {
    fontSize: "16px",
    color: "#94a3b8",
    lineHeight: 1.7,
    margin: 0,
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "16px",
  },
  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  featureDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    marginTop: "6px",
    flexShrink: 0,
  },
  right: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.5px",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 32px",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    letterSpacing: "0.01em",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #e2e8f0",
    fontSize: "15px",
    color: "#0f172a",
    backgroundColor: "#fff",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    width: "100%",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    bottom: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: 0,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
  },
  submitBtn: {
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "opacity 0.15s",
    marginTop: "4px",
  },
  legal: {
    fontSize: "12px",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: "20px",
  },
};
