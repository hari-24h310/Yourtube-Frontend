import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    BACKEND_URL: backendUrl,
    NEXT_PUBLIC_BACKEND_URL: backendUrl,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
