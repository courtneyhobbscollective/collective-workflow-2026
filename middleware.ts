import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const internalPaths = [
  "/dashboard",
  "/briefs",
  "/clients",
  "/crm",
  "/services",
  "/calendar",
  "/messages",
  "/reports",
  "/settings",
  "/live-work",
];
const portalPaths = ["/portal"];

export function middleware(req: NextRequest) {
  const role = req.cookies.get("workflow_role")?.value;
  const pathname = req.nextUrl.pathname;
  const isInternal = internalPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isPortal = portalPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if ((isInternal || isPortal) && !role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isInternal && role === "client") {
    return NextResponse.redirect(new URL("/portal", req.url));
  }
  if (isPortal && role !== "client") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/briefs/:path*",
    "/clients/:path*",
    "/crm/:path*",
    "/services/:path*",
    "/calendar/:path*",
    "/messages/:path*",
    "/reports/:path*",
    "/live-work",
    "/live-work/:path*",
    "/settings/:path*",
    "/portal/:path*"
  ]
};
