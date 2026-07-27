import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // '' as the prefix loads every var, not just VITE_-prefixed ones
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    build: {
      outDir: '../server/public',
      emptyOutDir: true
    },
    resolve: {
      alias: {
        'picocss': path.resolve(__dirname, '../node_modules/@picocss/pico/css')
      }
    },
    server: {
      proxy: {
        // dev only — never ships. Follows VITE_API_URL so changing the API port
        // doesn't mean editing this file.
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000'
        }
      }
    }
  }
})
