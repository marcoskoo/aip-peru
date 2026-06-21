import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel: build nativo de Next.js, no necesita output: "standalone" */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  allowedDevOrigins: ["127.0.0.1", "http://127.0.0.1:3000"],
};

export default nextConfig;
