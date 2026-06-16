"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Step = "details" | "otp";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  // ── Step 1: request OTP ──────────────────────────────────────────────────
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

  // ── Step 2: verify OTP ───────────────────────────────────────────────────
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
            Verify your email and get your unique chatbot ID in seconds. No passwords to remember.
          </p>
          <div style={styles.featureList}>
            {[
              "Sign in with a one-time code — no passwords",
              "Auto-generated bot ID tied to your account",
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
          {step === "details" ? (
            <>
              <h1 style={styles.title}>Create your account</h1>
              <p style={styles.subtitle}>
                Already have an account?{" "}
                <a href="/login" style={styles.link}>Sign in</a>
              </p>

              <form onSubmit={handleRequestOtp} style={styles.form}>
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

                {error && <div style={styles.errorBox}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Sending code…" : "Send verification code →"}
                </button>
              </form>

              <p style={styles.legal}>
                By signing up you agree to our{" "}
                <a href="#" style={styles.link}>Terms</a> and{" "}
                <a href="#" style={styles.link}>Privacy Policy</a>.
              </p>
            </>
          ) : (
            <>
              <h1 style={styles.title}>Check your email</h1>
              <p style={styles.subtitle}>
                Enter the 6-digit code sent to <strong>{form.email}</strong>
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
                  {loading ? "Verifying…" : "Verify & create account →"}
                </button>

                <div style={styles.otpActions}>
                  <button type="button" onClick={resendOtp} style={styles.linkBtn} disabled={loading}>
                    Resend code
                  </button>
                  <button type="button" onClick={() => setStep("details")} style={styles.linkBtn}>
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
