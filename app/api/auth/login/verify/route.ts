import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyLoginOtp, SESSION_COOKIE_OPTS } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
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
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 422 });
  }

  const result = await verifyLoginOtp(parsed.data.email, parsed.data.code);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const res = NextResponse.json({ user: result.user });
  res.cookies.set("session_token", result.sessionToken, SESSION_COOKIE_OPTS);
  return res;
}
