import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('@google/generative-ai')) return 'vendor-ai';
            if (id.includes('react-dom') || /node_modules\/react\//.test(id)) return 'vendor-react';
            if (id.includes('canvas-confetti') || id.includes('dexie')) return 'vendor-utils';
          }
          return undefined;
        },
      },
    },
  },
})
