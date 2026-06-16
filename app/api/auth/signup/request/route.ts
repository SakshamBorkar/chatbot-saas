import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestSignupOtp } from "@/lib/auth";

const Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,15}$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const result = await requestSignupOtp(parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    message: "Verification code sent to your email.",
  });
}
