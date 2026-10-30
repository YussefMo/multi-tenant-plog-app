import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'apps/owner/vitest.config.ts',
      'apps/tenant/vitest.config.ts',
      'apps/user/vitest.config.ts',
      'apps/visualizer/vitest.config.ts',
      'shared/vitest.config.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['shared/**/*.{ts,tsx}'],
    },
  },
});
