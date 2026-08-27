import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;