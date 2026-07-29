import { fileURLToPath } from 'url'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// One shared .env at the project root (Code/.env) rather than client/.env, so
// server and client read the same file instead of each keeping their own.
const rootEnvDir = path.resolve(__dirname, '..')

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootEnvDir)
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    envDir: rootEnvDir,
    build: {
      outDir: '../server/public',
      emptyOutDir: true
    },
    server: {
      proxy: {
        // dev only — never ships. Follows VITE_API_URL so changing the API port
        // doesn't mean editing this file.
        //
        // Only /api is proxied. /auth is deliberately left off: the GitHub
        // OAuth round trip has to land back on the API's own origin for the
        // session cookie to be set, so the client calls it absolutely instead
        // (see src/config/api.js).
        '/api': {
          target: apiUrl
        }
      }
    }
  }
})
