import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Akinator photos can be served from various hosts under the akinator.com domain.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.akinator.com",
      },
    ],
  },
};

export default nextConfig;
