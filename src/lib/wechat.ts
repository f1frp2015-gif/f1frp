/**
 * 微信公众号网页授权登录(snsapi_userinfo)。
 *
 * ⚠ 这是「公众号网页授权」,不是「开放平台网站应用扫码登录」。两者凭证与授权
 * 入口不通用:本站只有公众号,故走 oauth2/authorize 链路,凭证用公众号的
 * WECHAT_APP_ID / WECHAT_APP_SECRET。
 *
 * 固有限制:公众号网页授权**只在微信内置浏览器里有效**。桌面浏览器打开
 * authorize 链接会被微信判为非法来源(无法扫码登录 —— 扫码需开放平台网站应用)。
 * 因此入口侧(/api/auth/wechat/start + 登录表单)对非微信环境降级为提示,
 * 桌面端走手机号验证码登录。
 *
 * 所需环境变量(公众号后台 → 设置与开发 → 基本配置):
 *   WECHAT_APP_ID       公众号 AppID(形如 wx981c6e3aa7bb9647)
 *   WECHAT_APP_SECRET   公众号 AppSecret
 * 另需在公众号后台「网页授权域名」里填 f1frp.com(不含协议/路径)。
 *
 * 标注 VERIFY 的两处需对真机(微信内)联调一次:unionid 仅当该公众号已绑定
 * 微信开放平台账号时才返回,否则只有 openid(本站 find-or-create 已兼容)。
 */

/**
 * 是否已配置**真实**公众号凭证。
 * 关键:.env 模板里的占位符是 `wx_xxx` / `xxx`,它们是 truthy —— 若只判存在,
 * 占位符会骗过门控,生成 appid=wx_xxx 的授权链接,用户在微信里只会拿到报错。
 * 故按真实格式校验:AppID 形如 wx+16 位字母数字,AppSecret 为 32 位十六进制。
 * 不达标 → 视为未配置 → 入口降级「即将开放」,而不是抛一个坏链接给用户。
 */
export function wechatConfigured(): boolean {
  const appId = process.env.WECHAT_APP_ID ?? "";
  const secret = process.env.WECHAT_APP_SECRET ?? "";
  return /^wx[0-9a-z]{16,}$/i.test(appId) && /^[0-9a-f]{32}$/i.test(secret);
}

/**
 * 构造公众号网页授权地址(snsapi_userinfo —— 弹出授权页,换昵称/头像/unionid)。
 * 注意:`#wechat_redirect` 必须保留在末尾,微信据此触发授权跳转;redirect_uri
 * 由 URLSearchParams 自动百分号编码。
 */
export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const appid = process.env.WECHAT_APP_ID ?? "";
  const params = new URLSearchParams({
    appid,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "snsapi_userinfo",
    state,
  });
  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
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
