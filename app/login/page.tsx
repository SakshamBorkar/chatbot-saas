"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setInfo(`We sent a 6-digit code to ${email}`);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the full 6-digit code.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    if (value && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const resendOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not resend code.");
        return;
      }
      setInfo("A new code has been sent.");
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
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
          <h2 style={styles.tagline}>Welcome back.</h2>
          <p style={styles.taglineSub}>
            Sign in with a one-time code sent to your email — no password needed.
          </p>
          <div style={styles.statRow}>
            {[
              { value: "1", label: "script tag to embed" },
              { value: "∞", label: "websites supported" },
              { value: "24/7", label: "always on" },
            ].map((s) => (
              <div key={s.label} style={styles.stat}>
                <span style={styles.statValue}>{s.value}</span>
                <span style={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.right}>
        <div style={styles.card}>
          {step === "email" ? (
            <>
              <h1 style={styles.title}>Sign in</h1>
              <p style={styles.subtitle}>
                Don't have an account?{" "}
                <a href="/signup" style={styles.link}>Create one free</a>
              </p>

              <form onSubmit={handleRequestOtp} style={styles.form}>
                <div style={styles.fieldWrap}>
                  <label style={styles.label}>Email address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {error && <div style={styles.errorBox}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Sending code…" : "Send sign-in code →"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 style={styles.title}>Check your email</h1>
              <p style={styles.subtitle}>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>

              <form onSubmit={handleVerifyOtp} style={styles.form}>
                <div style={styles.otpRow}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      style={styles.otpInput}
                    />
                  ))}
                </div>

                {info && <div style={styles.infoBox}>{info}</div>}
                {error && <div style={styles.errorBox}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Verifying…" : "Verify & sign in →"}
                </button>

                <div style={styles.otpActions}>
                  <button type="button" onClick={resendOtp} style={styles.linkBtn} disabled={loading}>
                    Resend code
                  </button>
                  <button type="button" onClick={() => setStep("email")} style={styles.linkBtn}>
                    ← Change email
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
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
    fontSize: "40px",
    fontWeight: 700,
    color: "#f8fafc",
    lineHeight: 1.1,
    letterSpacing: "-1.5px",
    margin: 0,
  },
  taglineSub: {
    fontSize: "16px",
    color: "#94a3b8",
    lineHeight: 1.7,
    margin: 0,
    maxWidth: "340px",
  },
  statRow: {
    display: "flex",
    gap: "32px",
    marginTop: "24px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: "-1px",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
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
    maxWidth: "400px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-1px",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 36px",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontWeight: 500,
    fontSize: "13px",
    cursor: "pointer",
    padding: 0,
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
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #e2e8f0",
    fontSize: "15px",
    color: "#0f172a",
    backgroundColor: "#fff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  otpRow: {
    display: "flex",
    gap: "10px",
    justifyContent: "space-between",
  },
  otpInput: {
    width: "48px",
    height: "56px",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: 700,
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    outline: "none",
    color: "#0f172a",
  },
  otpActions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "-8px",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
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
    marginTop: "4px",
  },
};
