/**
 * 微信网页扫码登录(开放平台 snsapi_login)。
 *
 * 现状:除两处对微信服务器的网络调用外,整条链路(授权 URL 构造、state 校验、
 * find-or-create、签发会话、UI 入口)都已接好。微信凭证齐备后即可激活;未配置时
 * 入口降级为「即将开放」。
 *
 * 所需环境变量(待开通微信开放平台网站应用后填写):
 *   WECHAT_APP_ID
 *   WECHAT_APP_SECRET
 *
 * 标注 VERIFY 的两处需在拿到真实凭证后对真机联调一次(unionid 是否返回取决于
 * 该网站应用是否已绑定微信开放平台账号)。
 */

export function wechatConfigured(): boolean {
  return Boolean(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET);
}

/** 构造扫码登录授权地址(已建好,无需凭证即可拼接)。 */
export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const appid = process.env.WECHAT_APP_ID ?? "";
  const params = new URLSearchParams({
    appid,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "snsapi_login",
    state,
  });
  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
}

export type WechatToken = {
  accessToken: string;
  openid: string;
  unionid?: string;
  refreshToken?: string;
  expiresIn?: number;
};

export type WechatUserInfo = {
  openid: string;
  unionid?: string;
  nickname?: string;
  headimgurl?: string;
};

/** 用 code 换取用户级 access_token。未配置则抛错(门控)。 */
export async function exchangeCodeForToken(code: string): Promise<WechatToken> {
  if (!wechatConfigured()) throw new Error("微信登录未配置");
  // VERIFY against live WeChat once WECHAT_APP_* provisioned
  const params = new URLSearchParams({
    appid: process.env.WECHAT_APP_ID!,
    secret: process.env.WECHAT_APP_SECRET!,
    code,
    grant_type: "authorization_code",
  });
  const resp = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?${params.toString()}`);
  const d = (await resp.json()) as {
    access_token?: string;
    openid?: string;
    unionid?: string;
    refresh_token?: string;
    expires_in?: number;
    errcode?: number;
    errmsg?: string;
  };
  if (!d.access_token || !d.openid) {
    throw new Error(`微信换取 token 失败: ${d.errmsg ?? d.errcode ?? "未知错误"}`);
  }
  return {
    accessToken: d.access_token,
    openid: d.openid,
    unionid: d.unionid,
    refreshToken: d.refresh_token,
    expiresIn: d.expires_in,
  };
}

/** 拉取用户资料(昵称/头像/unionid)。未配置则抛错(门控)。 */
export async function fetchUserInfo(accessToken: string, openid: string): Promise<WechatUserInfo> {
  if (!wechatConfigured()) throw new Error("微信登录未配置");
  // VERIFY against live WeChat once WECHAT_APP_* provisioned
  const params = new URLSearchParams({ access_token: accessToken, openid, lang: "zh_CN" });
  const resp = await fetch(`https://api.weixin.qq.com/sns/userinfo?${params.toString()}`);
  const d = (await resp.json()) as {
    openid?: string;
    unionid?: string;
    nickname?: string;
    headimgurl?: string;
    errcode?: number;
    errmsg?: string;
  };
  if (!d.openid) {
    throw new Error(`微信拉取用户资料失败: ${d.errmsg ?? d.errcode ?? "未知错误"}`);
  }
  return { openid: d.openid, unionid: d.unionid, nickname: d.nickname, headimgurl: d.headimgurl };
}
