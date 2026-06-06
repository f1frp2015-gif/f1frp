import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: me.id,
      name: me.name,
      phone: me.phone,
      avatarUrl: me.avatarUrl,
      role: me.role,
      enterpriseId: me.enterpriseId,
    },
  });
}
