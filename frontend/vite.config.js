import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-core': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          
          // UI Libraries - Split further
          'framer-motion': ['framer-motion'],
          'lucide-icons': ['lucide-react'],
          
          // Three.js - Split into smaller chunks
          'three-core': ['three'],
          'three-fiber': ['@react-three/fiber'],
          'three-drei': ['@react-three/drei'],
          'three-vrm': ['@pixiv/three-vrm'],
          
          // Charts
          'recharts': ['recharts'],
          
          // Network & Utils
          'axios': ['axios'],
          'socket-io': ['socket.io-client'],
          
          // Other utilities
          'jwt-decode': ['jwt-decode'],
          'react-is': ['react-is']
        }
      }
    },
    chunkSizeWarningLimit: 1500, // Increase to 1500kb to reduce warnings
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false, // Disable sourcemaps for smaller builds
    reportCompressedSize: false // Faster builds
  },
  server: {
    port: 3000,
    host: true
  }
})
