import { NextResponse } from "next/server";
import { INDUSTRIES } from "@/lib/industries";

export async function GET() {
    const list = INDUSTRIES.map(({ key, label, emoji, description }) => ({
        key,
        label,
        emoji,
        description,
    }));
    return NextResponse.json({ industries: list });
}