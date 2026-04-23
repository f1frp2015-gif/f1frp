import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const isProtectedRoute = createRouteMatcher(["/:locale?/dashboard(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);

const handleIntlRouting = createIntlMiddleware(routing);

export default clerkMiddleware(async (auth, request) => {
  if (isApiRoute(request)) {
    return;
  }

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
