import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { upsertBot } from "./bots";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";
const JWT_EXPIRES = "7d";

export type JwtPayload = {
  userId: string;
  email: string;
  botId: string;
};

// ── Password ──────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

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

// ── Signup ────────────────────────────────────────────────────────────────────

export type SignupInput = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

export type AuthResult =
  | { success: true; token: string; user: SafeUser }
  | { success: false; error: string };

export type SafeUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  botId: string;
  createdAt: Date;
};

export async function signup(input: SignupInput): Promise<AuthResult> {
  const { name, phone, email, password } = input;

  // Check duplicate email
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const botId = generateBotId(name);

  // Create Bot first (User has FK to Bot)
  await upsertBot({
    botId,
    customerName: name,
    theme: "light",
    primaryColor: "#2563eb",
  });

  const user = await db.user.create({
    data: { name, phone, email, passwordHash, botId },
  });

  const token = signToken({ userId: user.id, email: user.email, botId: user.botId });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      botId: user.botId,
      createdAt: user.createdAt,
    },
  };
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password." };
  }

  const token = signToken({ userId: user.id, email: user.email, botId: user.botId });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      botId: user.botId,
      createdAt: user.createdAt,
    },
  };
}

// ── Middleware helper ─────────────────────────────────────────────────────────

import { NextRequest } from "next/server";

export function getAuthUser(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // Also check cookie for SSR pages
  const cookieToken = req.cookies.get("auth_token")?.value;

  return verifyToken(token ?? cookieToken ?? "");
}
