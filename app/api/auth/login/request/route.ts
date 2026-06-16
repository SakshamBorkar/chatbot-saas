import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestLoginOtp } from "@/lib/auth";

const Schema = z.object({
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
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 422 });
  }

  const result = await requestLoginOtp(parsed.data.email);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Sign-in code sent to your email.",
  });
}
