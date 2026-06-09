import { headers } from "next/headers";

export type TenantContext = {
  tenantId: string;
  businessName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  slug: string;
};

export async function getTenant(): Promise<TenantContext | null> {
  const h = await headers();
  const raw = h.get("x-tenant-data");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TenantContext;
  } catch {
    return null;
  }
}

export async function getTenantId(): Promise<string | null> {
  const h = await headers();
  return h.get("x-tenant-id");
}
