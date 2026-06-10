import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";

export default auth(async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // API routes are always public — no auth required
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Login page is always accessible
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!request.auth?.user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // In multi-tenant mode: resolve tenant and inject headers
  const agencyPlatformUrl = process.env.AGENCY_PLATFORM_URL;
  if (!agencyPlatformUrl) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  const tenant = await resolveTenant(host);

  if (!tenant) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenant.tenantId);
  requestHeaders.set("x-tenant-data", JSON.stringify({
    tenantId: tenant.tenantId,
    businessName: tenant.businessName,
    logoUrl: tenant.logoUrl,
    primaryColor: tenant.primaryColor,
    slug: tenant.slug,
  }));

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!api/auth|api/carddav|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
