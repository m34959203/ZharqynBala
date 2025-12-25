import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://zharqynbala-production.up.railway.app',
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Disable strict mode for production (can cause double renders in dev)
  reactStrictMode: true,

  // Skip type checking during build (faster builds)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
