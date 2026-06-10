import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/.well-known/carddav" ||
    pathname === "/.well-known/carddav/"
  ) {
    return NextResponse.redirect(new URL("/api/carddav/", req.url), 301);
  }

  const isLoggedIn = !!req.auth;
  const isLoginPage = pathname === "/login";
  // Auth callback routes must pass through with tenant headers but without redirect checks,
  // otherwise x-tenant-id is never set and the tenant isolation check in authorize() is skipped.
  const isAuthRoute = pathname.startsWith("/api/auth");

  // Resolve tenant from hostname (only when AGENCY_PLATFORM_URL is configured)
  const host = req.headers.get("host") ?? "";
  const tenant = await resolveTenant(host);

  if (tenant) {
    // Tenant not active → block access
    if (tenant.status === "suspended" && !isAuthRoute) {
      return new Response("This account has been suspended.", { status: 403 });
    }

    // Build new request headers with tenant context
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-tenant-id", tenant.tenantId);
    requestHeaders.set(
      "x-tenant-data",
      JSON.stringify({
        tenantId: tenant.tenantId,
        businessName: tenant.businessName,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        slug: tenant.slug,
      })
    );

    if (!isAuthRoute) {
      // Session must belong to this tenant — cross-tenant JWT must not grant access
      const sessionTenantId = (req.auth as { user?: { tenantId?: string } } | null)?.user?.tenantId;
      if (isLoggedIn && sessionTenantId !== tenant.tenantId) {
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.delete("authjs.session-token");
        response.cookies.delete("__Secure-authjs.session-token");
        return response;
      }

      if (!isLoggedIn && !isLoginPage) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (isLoggedIn && isLoginPage) {
        return NextResponse.redirect(new URL("/calendar", req.url));
      }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Single-tenant / dev mode (no AGENCY_PLATFORM_URL)
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/calendar", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!api/carddav|api/setup|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
