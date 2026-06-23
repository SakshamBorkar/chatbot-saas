import crypto from "crypto";
import { db } from "./db";
import { upsertBot } from "./bots";
import { generateOtp, sendOtpEmail } from "./mailer";
import { v4 as uuidv4 } from "uuid";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ── botId generator ───────────────────────────────────────────────────────────

/**
 * Generate a unique, human-readable bot ID from the user's name.
 * e.g. "Rahul Sharma" → "rahul-sharma-a3f2"
 */
function generateBotId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const suffix = uuidv4().replace(/-/g, "").slice(0, 4);
  return `${slug}-${suffix}`;
}

// ── Session tokens ─────────────────────────────────────────────────────────────

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export type SafeUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  botId: string;
  createdAt: Date;
};

function toSafeUser(user: {
  id: string; name: string; phone: string; email: string; botId: string; createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    botId: user.botId,
    createdAt: user.createdAt,
  };
}

// ── Step 1: Request OTP (signup) ────────────────────────────────────────────────

export type RequestSignupOtpInput = {
  name: string;
  phone: string;
  email: string;
};

export type RequestOtpResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Begin signup: store pending user details + OTP, email the code.
 * No account is created yet — that happens on verification.
 */
export async function requestSignupOtp(
  input: RequestSignupOtpInput
): Promise<RequestOtpResult> {
  const { name, phone, email } = input;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists. Try signing in instead." };
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // Invalidate any previous pending OTPs for this email+purpose
  await db.otpCode.updateMany({
    where: { email, purpose: "signup", consumed: false },
    data: { consumed: true },
  });

  await db.otpCode.create({
    data: {
      email,
      code,
      purpose: "signup",
      payload: JSON.stringify({ name, phone }),
      expiresAt,
    },
  });

  try {
    await sendOtpEmail(email, code, "signup");
  } catch (err) {
    console.error("[auth] Failed to send signup OTP email:", err);
    return { success: false, error: "Failed to send verification email. Please try again." };
  }

  return { success: true };
}

// ── Step 2: Verify OTP (signup) → create account ────────────────────────────────

export type VerifyOtpResult =
  | { success: true; user: SafeUser; sessionToken: string }
  | { success: false; error: string };

export async function verifySignupOtp(
  email: string,
  code: string
): Promise<VerifyOtpResult> {
  const otp = await db.otpCode.findFirst({
    where: { email, purpose: "signup", consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { success: false, error: "No pending verification found. Please sign up again." };
  }

  if (otp.expiresAt < new Date()) {
    return { success: false, error: "This code has expired. Please sign up again." };
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    return { success: false, error: "Too many incorrect attempts. Please sign up again." };
  }

  if (otp.code !== code) {
    await db.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "Incorrect code. Please try again." };
  }

  // Code is correct — consume it and create the account
  await db.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

  const { name, phone } = JSON.parse(otp.payload ?? "{}") as { name: string; phone: string };

  // Double-check no race condition created the user already
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists. Try signing in instead." };
  }

  const botId = generateBotId(name);
  const sessionToken = generateSessionToken();

  // Create Bot first (User has FK to Bot)
  await upsertBot({
    botId,
    customerName: name,
    primaryColor: "#2563eb",
  });

  const user = await db.user.create({
    data: { name, phone, email, botId, sessionToken },
  });

  return { success: true, user: toSafeUser(user), sessionToken };
}

// ── Step 1: Request OTP (login) ─────────────────────────────────────────────────

export async function requestLoginOtp(email: string): Promise<RequestOtpResult> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "No account found with this email. Please sign up first." };
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await db.otpCode.updateMany({
    where: { email, purpose: "login", consumed: false },
    data: { consumed: true },
  });

  await db.otpCode.create({
    data: { email, code, purpose: "login", expiresAt },
  });

  try {
    await sendOtpEmail(email, code, "login");
  } catch (err) {
    console.error("[auth] Failed to send login OTP email:", err);
    return { success: false, error: "Failed to send sign-in email. Please try again." };
  }

  return { success: true };
}

// ── Step 2: Verify OTP (login) ───────────────────────────────────────────────────

export async function verifyLoginOtp(
  email: string,
  code: string
): Promise<VerifyOtpResult> {
  const otp = await db.otpCode.findFirst({
    where: { email, purpose: "login", consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { success: false, error: "No pending sign-in request found. Please try again." };
  }

  if (otp.expiresAt < new Date()) {
    return { success: false, error: "This code has expired. Please request a new one." };
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    return { success: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  if (otp.code !== code) {
    await db.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "Incorrect code. Please try again." };
  }

  await db.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Account not found." };
  }

  const sessionToken = generateSessionToken();
  await db.user.update({ where: { id: user.id }, data: { sessionToken } });

  return { success: true, user: toSafeUser(user), sessionToken };
}

// ── Session lookup ────────────────────────────────────────────────────────────

export async function getUserBySessionToken(token: string): Promise<SafeUser | null> {
  if (!token) return null;
  const user = await db.user.findUnique({ where: { sessionToken: token } });
  return user ? toSafeUser(user) : null;
}

export async function invalidateSession(token: string): Promise<void> {
  await db.user.updateMany({
    where: { sessionToken: token },
    data: { sessionToken: null },
  });
}

// ── Request helper (cookie-based) ───────────────────────────────────────────────

import { NextRequest } from "next/server";

export async function getAuthUser(req: NextRequest): Promise<SafeUser | null> {
  const cookieToken = req.cookies.get("session_token")?.value;
  const headerToken = req.headers.get("authorization")?.replace("Bearer ", "");
  const token = cookieToken ?? headerToken;
  if (!token) return null;
  return getUserBySessionToken(token);
}

export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_COOKIE_MAX_AGE,
  path: "/",
};
