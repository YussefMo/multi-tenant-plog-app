import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    name: 'shared',
    environment: 'happy-dom',
    setupFiles: ['../test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules'],
  },
});
