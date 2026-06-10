import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import path from "path";

expand(config({ path: path.resolve(process.cwd(), ".env.local") }));

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
