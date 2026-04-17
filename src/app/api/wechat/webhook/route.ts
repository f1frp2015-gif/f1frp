import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const echostr = url.searchParams.get("echostr");

  if (echostr) {
    return new NextResponse(echostr);
  }
  return NextResponse.json({ status: "ok" });
}

export async function POST(req: NextRequest) {
  const _body = await req.text();

  return new NextResponse(
    `<xml>
      <ToUserName><![CDATA[user]]></ToUserName>
      <FromUserName><![CDATA[f1frp]]></FromUserName>
      <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[欢迎关注复材在线！访问 f1frp.com 获取更多信息。]]></Content>
    </xml>`,
    { headers: { "Content-Type": "application/xml" } }
  );
}
