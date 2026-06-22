import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { publicOrigin, publicUrl } from "@/lib/auth/public-origin";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

const handleIntlRouting = createIntlMiddleware(routing);

// 受保护路由:剥掉可选的 /zh 或 /en 前缀后,以 /dashboard 开头。
function isProtectedPath(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(zh|en)(?=\/|$)/, "");
  return stripped === "/dashboard" || stripped.startsWith("/dashboard/");
}

// P2-⑤ Host-based locale guard.
// f1frp.com (国内) → only zh; getfrp.com (海外) → only en.
const HOST_LOCALE: Record<string, "zh" | "en"> = {
  "f1frp.com": "zh",
  "www.f1frp.com": "zh",
  "getfrp.com": "en",
  "www.getfrp.com": "en",
};

function enforceHostLocale(request: NextRequest): NextResponse | undefined {
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const host = rawHost?.toLowerCase().split(":")[0];
  if (!host) return;
  const required = HOST_LOCALE[host];
  if (!required) return;

  const url = new URL(request.url);
  const seg = url.pathname.split("/")[1] ?? "";
  const wrong = required === "zh" ? "en" : "zh";
  if (seg === wrong) {
    const newPath = url.pathname.replace(`/${wrong}`, `/${required}`) || "/";
    return NextResponse.redirect(`${publicOrigin(request)}${newPath}${url.search}`, 308);
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // API 路由各自鉴权,中间件不拦截。
  if (pathname.startsWith("/api/")) return;

  const hostRedirect = enforceHostLocale(request);
  if (hostRedirect) return hostRedirect;

  if (isProtectedPath(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (!session) {
      // 用 X-Forwarded-* 还原真实 origin,避免回跳到 standalone 的 0.0.0.0:3000。
      const ret = publicUrl(request);
      const signInUrl = `${publicOrigin(request)}/sign-in?redirect_url=${encodeURIComponent(ret)}`;
      return NextResponse.redirect(signInUrl);
    }
  }

  return handleIntlRouting(request);
}

export const config = {
  matcher: [
    // indexnow-key 是无扩展名的顶层 route(在 [locale] 之外),必须排除,否则
    // next-intl 会把它改写进一个不存在的 locale 路径 → 404,IndexNow 校验失败。
    "/((?!_next|_vercel|indexnow-key|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
  ],
};
