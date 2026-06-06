import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/set-session";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSession(res);
  return res;
}
