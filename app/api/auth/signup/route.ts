import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signup } from "@/lib/auth";

const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,15}$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 422 });
  }

  const result = await signup(parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const res = NextResponse.json({ user: result.user, token: result.token }, { status: 201 });

  // Set HTTP-only cookie for SSR pages
  res.cookies.set("auth_token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return res;
}
