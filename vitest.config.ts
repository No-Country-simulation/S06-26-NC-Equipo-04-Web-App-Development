import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['modules/**', 'core/**', 'infrastructure/**'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', 'node_modules'],
    },
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@infrastructure': path.resolve(__dirname, 'infrastructure'),
      '@modules': path.resolve(__dirname, 'modules'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@core': path.resolve(__dirname, 'core'),
    },
  },
});
