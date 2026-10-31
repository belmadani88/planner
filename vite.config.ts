import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static-first build. The frontend is a fully static SPA with TWO entries:
//   index.html    — the planner itself
//   privacy.html  — the public Privacy Policy page (served at /privacy by
//                   Cloudflare Pages' clean-URL handling)
// /api/* is served by Cloudflare Pages Functions in production.
// For local end-to-end dev run `npm run pages:dev` (wrangler pages dev on :8788)
// and keep this proxy so `npm run dev` can talk to the functions runtime.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: new URL('index.html', import.meta.url).pathname,
        privacy: new URL('privacy.html', import.meta.url).pathname
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: false
      }
    }
  }
})
