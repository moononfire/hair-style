import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Skip API and auth routes
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const agencyPlatformUrl = process.env.AGENCY_PLATFORM_URL;

  // Not in multi-tenant mode — pass through
  if (!agencyPlatformUrl) {
    return NextResponse.next();
  }

  const tenant = await resolveTenant(host);

  if (!tenant) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenant.tenantId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
