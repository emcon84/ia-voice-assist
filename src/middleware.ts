import { NextRequest, NextResponse } from "next/server";

// Gate de la demo: /chat queda detrás de una cookie de acceso por código.
// Sin Clerk — la demo es autónoma y deployable en cualquier lado.
export function middleware(req: NextRequest) {
  const hasAccess = req.cookies.get("demo_access")?.value === "1";
  if (!hasAccess) {
    return NextResponse.redirect(new URL("/acceso", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/chat", "/chat/:path*"],
};
