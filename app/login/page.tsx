"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { themeColors } from "@/lib/theme";

type Step = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const colors = themeColors.light;
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
    // Check if session is already active
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          router.replace("/dashboard");
        }
      } catch {
        // Not authenticated
      }
    })();
  }, [router]);

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
      router.replace("/dashboard");
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

  const pageStyles = getPageStyles(colors);

  if (!mounted) {
    return <div style={{ ...pageStyles.page }} />;
  }

  return (
    <div style={pageStyles.page}>
      {/* Left panel */}
      <div style={pageStyles.left}>
        <div style={pageStyles.brand}>
          <span style={pageStyles.brandIcon}>🤖</span>
          <span style={pageStyles.brandName}>BotSaaS</span>
        </div>
        <div style={pageStyles.leftContent}>
          <h2 style={pageStyles.tagline}>Welcome back.</h2>
          <p style={pageStyles.taglineSub}>
            Sign in with a one-time code sent to your email - no password needed.
          </p>
          <div style={pageStyles.statRow}>
            {[
              { value: "1", label: "script tag to embed" },
              { value: "∞", label: "websites supported" },
              { value: "24/7", label: "always on" },
            ].map((s) => (
              <div key={s.label} style={pageStyles.stat}>
                <span style={pageStyles.statValue}>{s.value}</span>
                <span style={pageStyles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={pageStyles.right}>
        <div style={pageStyles.card}>
          {step === "email" ? (
            <>
              <h1 style={pageStyles.title}>Sign in</h1>
              <p style={pageStyles.subtitle}>
                Don't have an account?{" "}
                <a href="/signup" style={pageStyles.link}>Create one free</a>
              </p>

              <form onSubmit={handleRequestOtp} style={pageStyles.form}>
                <div style={pageStyles.fieldWrap}>
                  <label style={pageStyles.label}>Email address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ ...pageStyles.input, borderColor: colors.border }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {error && <div style={pageStyles.errorBox}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...pageStyles.submitBtn, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Sending code…" : "Send sign-in code →"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 style={pageStyles.title}>Check your email</h1>
              <p style={pageStyles.subtitle}>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>

              <form onSubmit={handleVerifyOtp} style={pageStyles.form}>
                <div style={pageStyles.otpRow}>
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
                      style={{ ...pageStyles.otpInput, borderColor: colors.border }}
                    />
                  ))}
                </div>

                {info && <div style={pageStyles.infoBox}>{info}</div>}
                {error && <div style={pageStyles.errorBox}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...pageStyles.submitBtn, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Verifying…" : "Verify & sign in →"}
                </button>

                <div style={pageStyles.otpActions}>
                  <button type="button" onClick={resendOtp} style={pageStyles.linkBtn} disabled={loading}>
                    Resend code
                  </button>
                  <button type="button" onClick={() => setStep("email")} style={pageStyles.linkBtn}>
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

function getPageStyles(colors: typeof themeColors.light) {
  return {
    page: {
      display: "flex" as const,
      minHeight: "100vh" as const,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' as const,
      backgroundColor: colors.bg,
    },
    left: {
      width: "44%" as const,
      backgroundColor: "#1e293b",
      padding: "48px",
      display: "flex" as const,
      flexDirection: "column" as const,
    },
    brand: {
      display: "flex" as const,
      alignItems: "center" as const,
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
      display: "flex" as const,
      flexDirection: "column" as const,
      justifyContent: "center" as const,
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
      display: "flex" as const,
      gap: "32px",
      marginTop: "24px",
    },
    stat: {
      display: "flex" as const,
      flexDirection: "column" as const,
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
      display: "flex" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: "48px 24px",
      backgroundColor: colors.bg,
    },
    card: {
      width: "100%" as const,
      maxWidth: "400px" as const,
    },
    title: {
      fontSize: "32px",
      fontWeight: 700,
      color: colors.text,
      letterSpacing: "-1px",
      margin: "0 0 8px",
    },
    subtitle: {
      fontSize: "14px",
      color: colors.textSecondary,
      margin: "0 0 36px",
    },
    link: {
      color: colors.primary,
      textDecoration: "none",
      fontWeight: 500,
    },
    linkBtn: {
      background: "none",
      border: "none",
      color: colors.primary,
      fontWeight: 500,
      fontSize: "13px",
      cursor: "pointer",
      padding: 0,
    },
    form: {
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: "20px",
    },
    fieldWrap: {
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: "6px",
    },
    label: {
      fontSize: "13px",
      fontWeight: 600,
      color: colors.text,
    },
    input: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: `1.5px solid ${colors.border}`,
      fontSize: "15px",
      color: colors.text,
      backgroundColor: colors.bgSecondary,
      outline: "none",
      width: "100%" as const,
      boxSizing: "border-box" as const,
      transition: "border-color 0.15s, box-shadow 0.15s",
    },
    otpRow: {
      display: "flex" as const,
      gap: "10px",
      justifyContent: "space-between" as const,
    },
    otpInput: {
      width: "48px" as const,
      height: "56px" as const,
      textAlign: "center" as const,
      fontSize: "22px",
      fontWeight: 700,
      borderRadius: "10px",
      border: `1.5px solid ${colors.border}`,
      outline: "none",
      color: colors.text,
      backgroundColor: colors.bgSecondary,
    },
    otpActions: {
      display: "flex" as const,
      justifyContent: "space-between" as const,
      marginTop: "-8px",
    },
    errorBox: {
      backgroundColor: colors.error + "20",
      border: `1px solid ${colors.error}60`,
      color: colors.error,
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "14px",
    },
    infoBox: {
      backgroundColor: colors.primary + "20",
      border: `1px solid ${colors.primary}60`,
      color: colors.primary,
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "13px",
    },
    submitBtn: {
      padding: "12px",
      borderRadius: "8px",
      backgroundColor: colors.primary,
      color: "#fff",
      fontSize: "15px",
      fontWeight: 600,
      border: "none",
      cursor: "pointer",
      marginTop: "4px",
    },
  };
}

