import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

/**
 * Vite config cho WEB BUILD
 * Dùng để build standalone web app (không phải Electron)
 */
export default defineConfig({
  root: './app',
  base: '/',
  envDir: '..',
  build: {
    outDir: '../dist-web',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'app/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@/app': resolve(__dirname, 'app'),
      '@/lib': resolve(__dirname, 'lib'),
      '@/resources': resolve(__dirname, 'resources'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
  },
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
