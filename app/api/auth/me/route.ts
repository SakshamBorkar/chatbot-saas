import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      botId: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// Logout — clear the cookie
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
  return res;
}
