/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' — працює і на Vercel, і на GitHub Pages (підшлях репозиторію)
// Абсолютна адреса для og:image: SITE_URL=https://… npm run build
const siteUrl = (process.env.SITE_URL ?? '.').replace(/\/$/, '')

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
