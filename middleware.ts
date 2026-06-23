import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isStaffRestrictedPath } from "@/lib/roles";
import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/session-cookie";

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
  "/help",
];
const portalPaths = ["/portal"];

const protectedApiPrefixes = ["/api/giphy", "/api/ai/chat", "/api/portal/", "/api/team-chat/"];

export async function middleware(req: NextRequest) {
  if (process.env.DEV_BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;
  const session = await parseSessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const role = session?.role;

  const isProtectedApi = protectedApiPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}`));
  if (isProtectedApi && !role) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (pathname === "/api/giphy" && role && role === "client") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

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

  /** Staff: no Sales (CRM, deal boards, leads, clients) or Business (services, reports). */
  if (role === "team_member" && isStaffRestrictedPath(pathname)) {
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
    "/help",
    "/settings/:path*",
    "/portal/:path*",
    "/api/giphy",
    "/api/ai/:path*",
    "/api/portal/:path*",
    "/api/team-chat/:path*",
  ],
};
