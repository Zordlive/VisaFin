import { defineConfig } from 'vite'

export default defineConfig(async () => {
  const reactPlugin = (await import('@vitejs/plugin-react')).default
  const { VitePWA } = await import('vite-plugin-pwa')

  return {
    plugins: [
      reactPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png'
        ],
        manifest: {
          name: 'VisaFin Gest',
          short_name: 'VisaFin',
          description: 'VisaFin Gest – Gestion et suivi financier sécurisé',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          orientation: 'portrait',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      port: 5173
    },
    preview: {
      port: 3000
    }
  }
})
