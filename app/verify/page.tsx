"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ── Inner component that uses useSearchParams ──────────────────────────────
function VerifyPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const mode = (params.get("mode") as "signup" | "login") || "login";
  const emailParam = params.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => otpRefs.current[0]?.focus(), 150);
  }, []);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Derived state: is the OTP fully entered?
  const otpComplete = otp.every((d) => d !== "");
  const otpCode = otp.join("");

  // ── OTP input handlers ──────────────────────────────────────────────────
  const handleOtpChange = (idx: number, value: string) => {
    // Allow only single digit
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    // Auto-advance to next box
    if (value && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setOtp(next);
    // Focus last filled or the next empty
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────
  const handleVerify = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpComplete) return;
    setError("");
    setInfo("");
    setLoading(true);

    const endpoint =
      mode === "signup"
        ? "/api/auth/signup/verify"
        : "/api/auth/login/verify";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam, code: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verification failed. Please try again.");
        return;
      }

      setSuccess(true);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Brief success animation before redirect
      setTimeout(() => router.push("/dashboard"), 600);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [otpComplete, otpCode, emailParam, mode, router]);

  // ── Resend OTP ──────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setInfo("");
    setLoading(true);

    const endpoint =
      mode === "signup"
        ? "/api/auth/signup/request"
        : "/api/auth/login/request";

    const body =
      mode === "signup"
        ? { name: params.get("name") || "", phone: params.get("phone") || "", email: emailParam }
        : { email: emailParam };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not resend code.");
        return;
      }

      setInfo("A new code has been sent to your email.");
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
      setResendCooldown(60);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Mask email for display ──────────────────────────────────────────────
  const maskedEmail = (() => {
    if (!emailParam) return "your email";
    const [local, domain] = emailParam.split("@");
    if (!domain) return emailParam;
    if (local.length <= 3) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 3)}***@${domain}`;
  })();

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Left branded panel */}
      <div style={styles.left}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🤖</span>
          <span style={styles.brandName}>BotSaaS</span>
        </div>
        <div style={styles.leftContent}>
          <div style={styles.shieldIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h2 style={styles.tagline}>
            {mode === "signup" ? "Almost there." : "Welcome back."}
          </h2>
          <p style={styles.taglineSub}>
            We sent a one-time verification code to your email. Enter it here
            to {mode === "signup" ? "complete your registration" : "sign in securely"} —
            no password needed.
          </p>
          <div style={styles.featureList}>
            {[
              "Code expires in 10 minutes",
              "Secure, one-time use",
              "Check spam folder if not received",
            ].map((f) => (
              <div key={f} style={styles.feature}>
                <span style={styles.featureDot} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — OTP form */}
      <div style={styles.right}>
        <div style={styles.card}>
          {/* Email icon */}
          <div style={styles.emailIconWrap}>
            <div style={styles.emailIcon}>✉️</div>
          </div>

          <h1 style={styles.title}>
            {success ? "Verified!" : "Check your email"}
          </h1>
          <p style={styles.subtitle}>
            {success ? (
              "Redirecting to your dashboard…"
            ) : (
              <>
                We sent a 6-digit code to{" "}
                <strong style={{ color: "#0f172a" }}>{maskedEmail}</strong>
              </>
            )}
          </p>

          {!success && (
            <form onSubmit={handleVerify} style={styles.form}>
              {/* 6-digit OTP boxes */}
              <div style={styles.otpRow} onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = digit ? "#2563eb" : "#e2e8f0";
                      e.target.style.boxShadow = "none";
                    }}
                    style={{
                      ...styles.otpInput,
                      borderColor: digit ? "#2563eb" : "#e2e8f0",
                      backgroundColor: digit ? "#eff6ff" : "#fff",
                    }}
                  />
                ))}
              </div>

              {/* Status messages */}
              {info && <div style={styles.infoBox}>{info}</div>}
              {error && <div style={styles.errorBox}>{error}</div>}

              {/* Verify button — disabled until all 6 digits entered */}
              <button
                type="submit"
                disabled={!otpComplete || loading}
                style={{
                  ...styles.submitBtn,
                  opacity: !otpComplete || loading ? 0.5 : 1,
                  cursor: !otpComplete || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? "Verifying…"
                  : mode === "signup"
                  ? "Verify & create account →"
                  : "Verify & sign in →"}
              </button>

              {/* Actions row */}
              <div style={styles.actionsRow}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  style={{
                    ...styles.linkBtn,
                    opacity: resendCooldown > 0 ? 0.5 : 1,
                    cursor: resendCooldown > 0 ? "default" : "pointer",
                  }}
                >
                  {resendCooldown > 0
                    ? `Resend code (${resendCooldown}s)`
                    : "Resend code"}
                </button>
                <a
                  href={mode === "signup" ? "/signup" : "/login"}
                  style={styles.linkBtn}
                >
                  ← {mode === "signup" ? "Back to signup" : "Change email"}
                </a>
              </div>
            </form>
          )}

          {/* Success checkmark animation */}
          {success && (
            <div style={styles.successWrap}>
              <div style={styles.successCircle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main export wrapped in Suspense for useSearchParams ─────────────────
export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Loading…
        </div>
      }
    >
      <VerifyPageInner />
    </Suspense>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: "#f8fafc",
  },

  /* ── Left panel ──────────────────────────────────────────────────────── */
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
  shieldIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "20px",
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    maxWidth: "360px",
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

  /* ── Right panel ─────────────────────────────────────────────────────── */
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
    textAlign: "center",
  },
  emailIconWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
  },
  emailIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#eff6ff",
    border: "2px solid #bfdbfe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
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
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    textAlign: "left",
  },

  /* ── OTP inputs ──────────────────────────────────────────────────────── */
  otpRow: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
  otpInput: {
    width: "52px",
    height: "60px",
    textAlign: "center" as const,
    fontSize: "24px",
    fontWeight: 700,
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    outline: "none",
    color: "#0f172a",
    transition: "border-color 0.15s, box-shadow 0.15s, background-color 0.15s",
    caretColor: "#2563eb",
  },

  /* ── Messages ────────────────────────────────────────────────────────── */
  infoBox: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    textAlign: "center" as const,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    textAlign: "center" as const,
  },

  /* ── Buttons ─────────────────────────────────────────────────────────── */
  submitBtn: {
    padding: "14px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 600,
    border: "none",
    transition: "opacity 0.2s, transform 0.1s",
    marginTop: "4px",
    letterSpacing: "-0.2px",
  },
  actionsRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "-4px",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontWeight: 500,
    fontSize: "13px",
    cursor: "pointer",
    padding: 0,
    textDecoration: "none",
  },

  /* ── Success state ───────────────────────────────────────────────────── */
  successWrap: {
    display: "flex",
    justifyContent: "center",
    marginTop: "24px",
  },
  successCircle: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#f0fdf4",
    border: "2px solid #86efac",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
