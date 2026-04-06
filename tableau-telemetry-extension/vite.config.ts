import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

/**
 * Vite plugin: server-side log collector.
 * The extension client POSTs JSON log entries to /api/log.
 * Each entry is appended to logs/session-<date>.log as a single line.
 * This lets you review full session logs from the filesystem even when
 * running inside Tableau Desktop where browser DevTools aren't available.
 */
function serverLogPlugin(): Plugin {
  const logsDir = resolve(__dirname, 'logs')
  if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true })

  // One log file per dev-server session
  const sessionStart = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const logFile = resolve(logsDir, `session-${sessionStart}.log`)

  return {
    name: 'server-log-collector',
    configureServer(server) {
      server.middlewares.use('/api/log', (req, res) => {
        // Handle CORS preflight
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const entries = JSON.parse(body)
            const lines = (Array.isArray(entries) ? entries : [entries]).map(
              (e: { level?: string; message?: string; timestamp?: number }) => {
                const ts = e.timestamp ? new Date(e.timestamp).toISOString() : new Date().toISOString()
                const lvl = (e.level ?? 'info').toUpperCase().padEnd(5)
                return `${ts} ${lvl} ${e.message ?? ''}`
              },
            )
            appendFileSync(logFile, lines.join('\n') + '\n')
            res.statusCode = 200
            res.end('ok')
          } catch {
            res.statusCode = 400
            res.end('Bad JSON')
          }
        })
      })

      console.log(`\n  📋 Server-side logs → ${logFile}\n`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serverLogPlugin()],

  // HTTPS required by Tableau Extensions API
  server: {
    https: {
      key: readFileSync(resolve(__dirname, 'certs/key.pem')),
      cert: readFileSync(resolve(__dirname, 'certs/cert.pem')),
    },
    host: '0.0.0.0',
    port: 5173,
  },

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
