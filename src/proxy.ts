import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const clerkEnabled = !!process.env.CLERK_SECRET_KEY;

export default async function proxy(req: NextRequest) {
  if (!clerkEnabled) {
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
  ]);

  const isPublicApiRoute = createRouteMatcher([
    "/api/v1/posts",
    "/api/v1/enterprises",
    "/api/wechat(.*)",
  ]);

  return clerkMiddleware(async (auth, request) => {
    if (isProtectedRoute(request) && !isPublicApiRoute(request)) {
      await auth.protect();
    }
  })(req, {} as any);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
