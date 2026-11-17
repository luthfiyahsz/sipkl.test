import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    serverActions: {
      // Upload dokumentasi jurnal / laporan akhir maksimal 2 MB + overhead multipart.
      bodySizeLimit: "6mb",
    },
  },
  // Batasi tracing ke root proyek ini (bukan folder induk Laravel) agar
  // output standalone berisi server.js langsung di root.
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },
};

export default nextConfig;
