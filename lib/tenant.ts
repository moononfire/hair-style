export type TenantData = {
  tenantId: string;
  slug: string;
  productId: string;
  status: string;
  schemaVersion: string;
  businessName: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

export async function resolveTenant(host: string): Promise<TenantData | null> {
  const baseUrl = process.env.AGENCY_PLATFORM_URL;
  const secret = process.env.AGENCY_API_SECRET;
  if (!baseUrl || !secret) return null;

  // Strip port for local dev
  const domain = host.split(":")[0];

  try {
    const res = await fetch(
      `${baseUrl}/api/tenant?domain=${encodeURIComponent(domain)}`,
      {
        headers: { "x-agency-secret": secret },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    return res.json() as Promise<TenantData>;
  } catch {
    return null;
  }
}
