import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // TODO: exchange code for session via WeChat API
  // 1. POST https://api.weixin.qq.com/sns/jscode2session
  //    ?appid=WECHAT_MINI_APP_ID
  //    &secret=WECHAT_MINI_APP_SECRET
  //    &js_code={code}
  //    &grant_type=authorization_code
  // 2. Get openid + session_key
  // 3. Find or create user in database
  // 4. Return JWT token for subsequent API calls

  return NextResponse.json(
    { message: "Mini program login requires WeChat credentials", code },
    { status: 501 }
  );
}
