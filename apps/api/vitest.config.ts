import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, 'src'),
      '@homelab/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
      '@homelab/db': path.resolve(__dirname, '../../packages/db/src'),
      '@homelab/infra': path.resolve(__dirname, '../../packages/infra/src'),
      '@homelab/storage': path.resolve(__dirname, '../../packages/storage/src'),
    },
  },
});
