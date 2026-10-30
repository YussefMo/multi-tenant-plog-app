import { mergeConfig, defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: 'visualizer',
      environment: 'happy-dom',
      setupFiles: ['../../test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  }),
);
