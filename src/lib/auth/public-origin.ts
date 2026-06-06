/**
 * 在 Next.js standalone(ECS / nginx 反向代理)部署下,request.url 的 host 部分是
 * 进程监听地址(如 0.0.0.0:3000),而非浏览器看到的 f1frp.com。任何把 request.url
 * 当回跳地址的逻辑都会让用户跳到 0.0.0.0:3000 → 登录后白屏。这里基于 nginx 转发的
 * X-Forwarded-Host / X-Forwarded-Proto 还原真实 origin。
 *
 * 同时被 proxy.ts(中间件)与微信 OAuth 路由复用。
 */
export function publicOrigin(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "f1frp.com";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export function publicUrl(request: Request, pathname?: string, search?: string): string {
  const u = new URL(request.url);
  return `${publicOrigin(request)}${pathname ?? u.pathname}${search ?? u.search}`;
}

/**
 * 校验 redirect_url 仅为同源相对路径,防开放重定向。
 * 返回安全路径(以单个 "/" 开头、非 "//"),否则返回 fallback。
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  // 允许传入绝对的本站 URL,提取其 path+search
  let candidate = value;
  try {
    if (/^https?:\/\//i.test(value)) {
      const u = new URL(value);
      candidate = `${u.pathname}${u.search}`;
    }
  } catch {
    return fallback;
  }
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  return candidate;
}
