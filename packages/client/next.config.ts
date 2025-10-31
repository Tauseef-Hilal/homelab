import type { NextConfig } from 'next';
import { env } from 'process';

const nextConfig: NextConfig = {
  allowedDevOrigins: [env.NEXT_PUBLIC_API_HOSTNAME ?? 'localhost'],
  images: {
    remotePatterns: [{ hostname: env.NEXT_PUBLIC_API_HOSTNAME ?? 'localhost' }],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
