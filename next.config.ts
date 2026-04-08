import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Load Prisma from node_modules at runtime. Bundling `@prisma/client` (especially under Turbopack)
  // can ship a stale/incomplete client where new models (e.g. serviceProduct) are missing.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Default Server Action body limit is 1MB; image uploads exceed that before our handler runs.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
