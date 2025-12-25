import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei', '@pixiv/three-vrm'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['axios', 'socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000kb
    target: 'esnext',
    minify: 'esbuild'
  },
  server: {
    port: 3000,
    host: true
  }
})
