import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Z.ai deploy requiere output: "standalone" para generar .next/standalone/server.js
  // (server autocontenido con todas las dependencias)
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  allowedDevOrigins: ["127.0.0.1", "http://127.0.0.1:3000"],
};

export default nextConfig;
