import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()] as any,
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  },
  test: {
    // Default to node to avoid jsdom/webidl issues in CI (Node version skew). Opt into jsdom per file:
    //   /* @vitest-environment jsdom */ at top of a test file.
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    reporters: process.env.CI ? ['default'] : ['default'],
    coverage: { enabled: false }
  }
});