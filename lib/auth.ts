import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const h = await headers();
        const tenantId = h.get("x-tenant-id");

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
            ...(tenantId ? { employee: { tenantId } } : {}),
          },
          include: { employee: true },
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        // In multi-tenant mode: require tenant context and verify user belongs to this tenant.
        // Fail closed — if tenantId is missing when AGENCY_PLATFORM_URL is set, deny login.
        const isMultiTenant = !!process.env.AGENCY_PLATFORM_URL;
        if (isMultiTenant && !tenantId) return null;
        if (tenantId && user.employee?.tenantId !== tenantId) return null;

        return { ...user, tenantId: tenantId ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.tenantId = (user as { tenantId?: string }).tenantId;
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.tenantId) session.user.tenantId = token.tenantId as string;
      return session;
    },
  },
});
