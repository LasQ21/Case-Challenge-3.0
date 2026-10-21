/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' — працює і на Vercel, і на GitHub Pages (підшлях репозиторію)
// Абсолютна адреса для og:image: SITE_URL=https://… npm run build.
// На Vercel без SITE_URL береться production-домен, який Vercel передає під час збірки.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
const siteUrl = (process.env.SITE_URL ?? (vercelHost ? `https://${vercelHost}` : '.')).replace(/\/$/, '')

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    { name: 'site-url', transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl) },
  ],
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
