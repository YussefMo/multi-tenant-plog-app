import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  test: {
    name: 'shared',
    environment: 'happy-dom',
    setupFiles: ['./setup.ts'],
    include: ['./**/*.{test,spec}.{ts,tsx}'],
  },
});
