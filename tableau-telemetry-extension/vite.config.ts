import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Inject version from package.json at build time
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

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
