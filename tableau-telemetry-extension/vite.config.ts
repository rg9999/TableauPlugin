import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Air-gapped deployment: relative paths, single bundle, no externals
  base: './',

  build: {
    // Single JS bundle — no code splitting for air-gapped deployment
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Exclude source maps from production bundle
    sourcemap: false,
    // Ensure all assets are co-located
    assetsInlineLimit: 4096,
  },
})
