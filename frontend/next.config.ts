import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GENOA_API_URL: process.env.NEXT_PUBLIC_GENOA_API_URL || 'http://localhost:8000/api',
  }
};

export default nextConfig;
