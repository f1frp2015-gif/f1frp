import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const isProtectedRoute = createRouteMatcher(["/:locale?/dashboard(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);

const handleIntlRouting = createIntlMiddleware(routing);

// 在 Next.js standalone (ECS / 反向代理) 部署下，request.url 的 host 部分会用
// 进程的监听 hostname（如 0.0.0.0:3000），而不是浏览器看到的 f1frp.com。
// 任何把 request.url 当 returnBackUrl 的逻辑都会让用户登录后跳到 0.0.0.0:3000，
// 浏览器自然访问失败 → 表现为"登录后页面空白"或"管理员面板没反应"。
// 这里基于 nginx 转发的 X-Forwarded-Host / X-Forwarded-Proto 还原真实 origin。
function publicOrigin(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "f1frp.com";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

function publicUrl(request: Request, pathname?: string, search?: string): string {
  const u = new URL(request.url);
  return `${publicOrigin(request)}${pathname ?? u.pathname}${search ?? u.search}`;
}

// P2-⑤ Host-based locale guard.
// f1frp.com (国内) → only zh; getfrp.com (海外) → only en.
// Belt-and-suspenders for the env-var-driven locale split: even if a build is
// deployed with both locales enabled, the host enforces the right one.
// Other hosts (vercel preview, localhost, dev) are not constrained.
const HOST_LOCALE: Record<string, "zh" | "en"> = {
  "f1frp.com": "zh",
  "www.f1frp.com": "zh",
  "getfrp.com": "en",
  "www.getfrp.com": "en",
};

function enforceHostLocale(request: Request): NextResponse | undefined {
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host");
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

export default clerkMiddleware(async (auth, request) => {
  if (isApiRoute(request)) {
    return;
  }

  const hostRedirect = enforceHostLocale(request);
  if (hostRedirect) return hostRedirect;

  if (isProtectedRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      // Build a clean public-facing returnBackUrl, not the standalone
      // 0.0.0.0:3000 URL that Clerk's redirectToSignIn would default to.
      const ret = publicUrl(request);
      const signInUrl = `${publicOrigin(request)}/sign-in?redirect_url=${encodeURIComponent(ret)}`;
      return NextResponse.redirect(signInUrl);
    }
  }

  return handleIntlRouting(request);
});

export const config = {
  matcher: [
    "/((?!_next|_vercel|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
  ],
};
