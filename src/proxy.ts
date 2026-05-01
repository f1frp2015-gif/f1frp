import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const isProtectedRoute = createRouteMatcher(["/:locale?/dashboard(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);

const handleIntlRouting = createIntlMiddleware(routing);

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
  const host = request.headers.get("host")?.toLowerCase().split(":")[0];
  if (!host) return;
  const required = HOST_LOCALE[host];
  if (!required) return;

  const url = new URL(request.url);
  const seg = url.pathname.split("/")[1] ?? "";
  const wrong = required === "zh" ? "en" : "zh";
  if (seg === wrong) {
    const rewritten = url.pathname.replace(`/${wrong}`, `/${required}`);
    url.pathname = rewritten || "/";
    return NextResponse.redirect(url, 308);
  }
}

export default clerkMiddleware(async (auth, request) => {
  if (isApiRoute(request)) {
    return;
  }

  const hostRedirect = enforceHostLocale(request);
  if (hostRedirect) return hostRedirect;

  if (isProtectedRoute(request)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: request.url });
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
