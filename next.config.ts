import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Paquetes que NO deben empaquetarse dentro de las serverless functions.
  // Se resuelven en runtime desde node_modules, reduciendo el tamano de
  // las functions en Vercel.
  // IMPORTANTE: no incluir aca paquetes que Next.js transpila automaticamente
  // (recharts, react-markdown, etc.) porque genera conflicto.
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "sharp",
    "leaflet",
    "react-leaflet",
    "react-syntax-highlighter",
    "@mdxeditor/editor",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
    "@reactuses/core",
    "react-zoom-pan-pinch",
    "react-resizable-panels",
    "embla-carousel-react",
    "react-day-picker",
    "react-hook-form",
    "@tanstack/react-table",
    "@tanstack/react-query",
    "input-otp",
    "vaul",
    "cmdk",
  ],
  // Excluir tracing de archivos pesados no necesarios en serverless
  outputFileTracingExcludes: {
    "/api/**": [
      "node_modules/leaflet/**",
      "node_modules/react-leaflet/**",
      "node_modules/recharts/**",
      "node_modules/react-syntax-highlighter/**",
      "node_modules/@mdxeditor/**",
      "node_modules/@dnd-kit/**",
      "node_modules/sharp/**",
      "node_modules/react-zoom-pan-pinch/**",
      "node_modules/embla-carousel-react/**",
      "node_modules/react-day-picker/**",
      "node_modules/@tanstack/**",
      "node_modules/react-markdown/**",
      "node_modules/remark-gfm/**",
      "public/charts/**",
      "public/aip-documents/**",
      "public/aip-charts/**",
    ],
  },
  allowedDevOrigins: ["127.0.0.1", "http://127.0.0.1:3000"],
};

export default nextConfig;
