import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (sessionCookie) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  if (pathname && pathname !== "/") {
    loginUrl.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /**
     * Protect everything EXCEPT:
     *  - Next.js internals (_next/static, _next/image)
     *  - favicon / public assets
     *  - Better-Auth handler (/api/auth/*)
     *  - Health check
     *  - Auth pages themselves
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/health|login|signup|verify-email|forgot-password|reset-password).*)",
  ],
};
