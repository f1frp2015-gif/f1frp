import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const category = url.searchParams.get("category");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  return NextResponse.json({
    data: [],
    pagination: { page, limit, total: 0 },
    filters: { type, category },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json(
    { message: "Post creation requires database connection", received: body },
    { status: 501 }
  );
}
