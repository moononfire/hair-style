import { headers } from "next/headers";

export async function getTenantId(): Promise<string | null> {
  const h = await headers();
  return h.get("x-tenant-id");
}

// Buduje fragment `where` dla Prisma — pusty gdy brak tenantId (tryb dev)
export function tf(tenantId: string | null): { tenantId?: string } {
  return tenantId ? { tenantId } : {};
}
