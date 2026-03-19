import path from 'path';
import type { NextConfig } from 'next';
import { env } from 'process';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  allowedDevOrigins: [env.NEXT_PUBLIC_API_HOSTNAME ?? 'localhost'],
  images: {
    remotePatterns: [{ hostname: env.NEXT_PUBLIC_API_HOSTNAME ?? 'localhost' }],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
