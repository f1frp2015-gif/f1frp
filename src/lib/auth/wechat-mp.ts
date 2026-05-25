// 微信公众号 网页授权 (OAuth2) — 国内侧 (f1frp.com / AI_PROFILE=domestic) 登录基础。
//
// 文档:微信公众号 → 网页授权获取用户基本信息。
// 流程:
//   1. 浏览器(微信内)跳 buildAuthorizeUrl() → 用户授权 → 微信回跳带 ?code=&state=
//   2. exchangeCodeForToken(code) → { access_token, openid, unionid? }
//   3. (scope=snsapi_userinfo 时) fetchUserInfo() → 昵称/头像/unionid
//   4. 上层用 openid/unionid upsert users 行 + 签发会话(Auth.js,后续阶段接)
//
// 适用范围:仅"微信内置浏览器"打开的网页。PC/外部浏览器扫码登录走开放平台
// 网站应用(后续阶段),与此模块分开。
//
// 安全:AppSecret 只从 env 读,绝不入库、不入码、不进日志。AppID 非密,可有默认值。

const APPID = process.env.WECHAT_MP_APPID ?? "wx981c6e3aa7bb9647";

export function isWechatMpConfigured(): boolean {
  return Boolean(process.env.WECHAT_MP_APPSECRET);
}

export type WechatScope = "snsapi_base" | "snsapi_userinfo";

// 构造网页授权跳转 URL。redirectUri 必须在公众号后台「网页授权域名」(f1frp.com) 下。
// state 用于防 CSRF + 回带业务参数(上层生成随机值并校验)。
export function buildAuthorizeUrl(opts: {
  redirectUri: string;
  state: string;
  scope?: WechatScope;
}): string {
  const params = new URLSearchParams({
    appid: APPID,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: opts.scope ?? "snsapi_userinfo",
    state: opts.state,
  });
  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}

interface WxTokenResp {
  access_token?: string;
  expires_in?: number;
  openid?: string;
  unionid?: string;
  scope?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatToken {
  accessToken: string;
  openid: string;
  unionid?: string;
  scope: string;
}

export async function exchangeCodeForToken(code: string): Promise<WechatToken> {
  const secret = process.env.WECHAT_MP_APPSECRET;
  if (!secret) throw new Error("WECHAT_MP_APPSECRET not set");
  const url =
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}` +
    `&secret=${secret}&code=${encodeURIComponent(code)}&grant_type=authorization_code`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = (await res.json()) as WxTokenResp;
  if (data.errcode || !data.access_token || !data.openid) {
    throw new Error(
      `wechat oauth2 token failed: ${data.errcode ?? "?"} ${data.errmsg ?? "no token/openid"}`,
    );
  }
  return {
    accessToken: data.access_token,
    openid: data.openid,
    unionid: data.unionid,
    scope: data.scope ?? "",
  };
}

interface WxUserInfoResp {
  openid?: string;
  nickname?: string;
  headimgurl?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatUserInfo {
  openid: string;
  nickname: string;
  avatarUrl: string;
  unionid?: string;
}

// 仅 scope=snsapi_userinfo 时可用;snsapi_base 只能拿 openid(静默登录)。
export async function fetchUserInfo(
  accessToken: string,
  openid: string,
): Promise<WechatUserInfo> {
  const url =
    `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}` +
    `&openid=${openid}&lang=zh_CN`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = (await res.json()) as WxUserInfoResp;
  if (data.errcode || !data.openid) {
    throw new Error(
      `wechat userinfo failed: ${data.errcode ?? "?"} ${data.errmsg ?? "no openid"}`,
    );
  }
  return {
    openid: data.openid,
    nickname: data.nickname ?? "",
    avatarUrl: data.headimgurl ?? "",
    unionid: data.unionid,
  };
}
