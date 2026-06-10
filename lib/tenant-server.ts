import { headers } from "next/headers";

export async function getTenantId(): Promise<string | null> {
  const h = await headers();
  return h.get("x-tenant-id");
}

// Buduje fragment `where` dla Prisma z tenantId
export function tf(tenantId: string | null): { tenantId: string } {
  if (!tenantId) throw new Error("Missing tenantId — AGENCY_PLATFORM_URL not configured?");
  return { tenantId };
}
