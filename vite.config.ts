/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '@server': fileURLToPath(new URL('./server/src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup-localstorage.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**', 'server/src/**', 'shared/**'],
      exclude: ['**/*.d.ts', 'src/main.tsx', 'src/vite-env.d.ts', 'shared/package.json'],
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('@chakra-ui') || id.includes('@emotion')) return 'chakra'
          if (id.includes('react-virtuoso')) return 'virtuoso'
          if (
            id.includes('react-router') ||
            id.includes('react-dom') ||
            id.includes('scheduler') ||
            /[\\/]react[\\/]/.test(id)
          )
            return 'react'
        },
      },
    },
  },
})
