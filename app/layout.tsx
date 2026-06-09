import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { getTenant } from "@/lib/tenant-context";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  return {
    title: tenant?.businessName ?? "HairBook",
    description: "System zarządzania wizytami w salonie fryzjerskim",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenant();

  const brandingStyle = tenant?.primaryColor
    ? ({ "--primary": tenant.primaryColor } as React.CSSProperties)
    : undefined;

  return (
    <html
      lang="pl"
      className={`${jakarta.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={brandingStyle}>
        {children}
      </body>
    </html>
  );
}
