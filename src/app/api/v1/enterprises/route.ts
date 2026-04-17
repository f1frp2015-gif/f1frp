import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const province = url.searchParams.get("province");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  return NextResponse.json({
    data: [],
    pagination: { page, limit, total: 0 },
    filters: { category, province },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json(
    { message: "Enterprise registration requires database connection", received: body },
    { status: 501 }
  );
}
