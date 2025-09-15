import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()] as any, // cast to any to avoid potential minor version type widening conflicts
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts']
  }
})