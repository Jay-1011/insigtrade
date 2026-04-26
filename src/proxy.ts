import { NextResponse, type NextRequest } from "next/server";

// Expose the current pathname to server components via a request header
// so the root layout can conditionally render Header/Footer.
// Next.js 16 renamed `middleware` → `proxy`. Same semantics.
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Skip static files & next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
