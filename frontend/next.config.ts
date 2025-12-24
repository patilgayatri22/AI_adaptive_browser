/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Environment variables available at runtime
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001',
  },

  // Disable ESLint during build for Docker
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build for Docker
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
