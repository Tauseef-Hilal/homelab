import type { NextConfig } from 'next';
import { env } from 'process';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: env.NEXT_PUBLIC_API_HOSTNAME ?? 'localhost' },
    ],
  },
};

export default nextConfig;
