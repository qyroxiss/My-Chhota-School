import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg', 'prisma'],
};

export default nextConfig;
