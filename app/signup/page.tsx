"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { themeColors } from "@/lib/theme";

type Step = "details" | "otp";
type IndustryOption = { key: string; label: string; emoji: string; description: string };

export default function SignupPage() {
  const router = useRouter();
  const colors = themeColors.light;
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({ name: "", phone: "", email: "", industry: "" });
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/industries")
      .then((res) => res.json())
      .then((data) => setIndustries(data.industries ?? []))
      .catch(() => setIndustries([]))
  }, []);

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

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setInfo(`We sent a 6-digit code to ${form.email}`);
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
      const res = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code }),
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
      const res = await fetch("/api/auth/signup/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
          <h2 style={pageStyles.tagline}>
            One script tag.<br />Infinite conversations.
          </h2>
          <p style={pageStyles.taglineSub}>
            Verify your email and get your unique chatbot ID in seconds. No passwords to remember.
          </p>
          <div style={pageStyles.featureList}>
            {[
              "Sign in with a one-time code - no passwords",
              "Auto-generated bot ID tied to your account",
              "Embeds on any site with one line of code",
            ].map((f) => (
              <div key={f} style={pageStyles.feature}>
                <span style={{ ...pageStyles.featureDot, backgroundColor: colors.primary }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={pageStyles.right}>
        <div style={pageStyles.card}>
          {step === "details" ? (
            <>
              <h1 style={pageStyles.title}>Create your account</h1>
              <p style={pageStyles.subtitle}>
                Already have an account?{" "}
                <a href="/login" style={pageStyles.link}>Sign in</a>
              </p>

              <form onSubmit={handleRequestOtp} style={pageStyles.form}>
                <Field
                  label="Full name"
                  type="text"
                  placeholder="Rahul Sharma"
                  value={form.name}
                  onChange={(v) => update("name", v)}
                  required
                  colors={colors}
                />
                <Field
                  label="Phone number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                  required
                  colors={colors}
                />
                <Field
                  label="Email address"
                  type="email"
                  placeholder="rahul@example.com"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  required
                  colors={colors}
                />

                <div style={pageStyles.fieldWrap}>
                  <label style={pageStyles.label}>Industry</label>
                  <select
                    value={form.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    required
                    style={pageStyles.select}
                  >
                    <option value="" disabled>
                      Select your industry…
                    </option>
                    {industries.map((ind) => (
                      <option key={ind.key} value={ind.key}>
                        {ind.emoji} {ind.label}
                      </option>
                    ))}
                  </select>
                  {form.industry && (
                    <div style={pageStyles.industryHint}>
                      {industries.find((i) => i.key === form.industry)?.description}
                    </div>
                  )}
                </div>

                {error && <div style={pageStyles.errorBox}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...pageStyles.submitBtn, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Sending code…" : "Send verification code →"}
                </button>
              </form>

              <p style={pageStyles.legal}>
                By signing up you agree to our{" "}
                <a href="#" style={pageStyles.link}>Terms</a> and{" "}
                <a href="#" style={pageStyles.link}>Privacy Policy</a>.
              </p>
            </>
          ) : (
            <>
              <h1 style={pageStyles.title}>Check your email</h1>
              <p style={pageStyles.subtitle}>
                Enter the 6-digit code sent to <strong>{form.email}</strong>
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
                  {loading ? "Verifying…" : "Verify & create account →"}
                </button>

                <div style={pageStyles.otpActions}>
                  <button type="button" onClick={resendOtp} style={pageStyles.linkBtn} disabled={loading}>
                    Resend code
                  </button>
                  <button type="button" onClick={() => setStep("details")} style={pageStyles.linkBtn}>
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

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
  colors,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  colors: typeof themeColors.light;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" } as const}>
      <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text, letterSpacing: "0.01em" }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: "10px 14px",
          borderRadius: "8px",
          border: `1.5px solid ${focused ? colors.primary : colors.border}`,
          fontSize: "15px",
          color: colors.text,
          backgroundColor: colors.bgSecondary,
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          width: "100%",
          boxSizing: "border-box" as const,
          boxShadow: focused ? `0 0 0 3px ${colors.primary}20` : "none",
        }}
      />
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
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: "14px",
      marginTop: "16px",
    },
    feature: {
      display: "flex" as const,
      alignItems: "flex-start" as const,
      gap: "12px",
      color: "#cbd5e1",
      fontSize: "14px",
      lineHeight: 1.5,
    },
    featureDot: {
      width: "6px" as const,
      height: "6px" as const,
      borderRadius: "50%" as const,
      marginTop: "6px",
      flexShrink: 0,
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
      maxWidth: "420px" as const,
    },
    title: {
      fontSize: "28px",
      fontWeight: 700,
      color: colors.text,
      letterSpacing: "-0.5px",
      margin: "0 0 8px",
    },
    subtitle: {
      fontSize: "14px",
      color: colors.textSecondary,
      margin: "0 0 32px",
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
      letterSpacing: "0.01em",
    },
    select: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: `1.5px solid ${colors.border}`,
      fontSize: "15px",
      color: colors.text,
      backgroundColor: colors.bgSecondary,
      outline: "none",
      width: "100%" as const,
      boxSizing: "border-box" as const,
      cursor: "pointer",
      transition: "border-color 0.15s",
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
      outline: "none",
      color: colors.text,
      backgroundColor: colors.bgSecondary,
    },
    otpActions: {
      display: "flex" as const,
      justifyContent: "space-between" as const,
      marginTop: "-8px",
    },
    industryHint: {
      fontSize: "12px",
      color: "#94a3b8",
      marginTop: "2px",
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
      transition: "opacity 0.15s",
      marginTop: "4px",
    },
    legal: {
      fontSize: "12px",
      color: colors.textSecondary,
      textAlign: "center" as const,
      marginTop: "20px",
    },
  };
}

