import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FESTEN.',
    short_name: 'FESTEN.',
    description: 'Hitta och boka lokala talanger till ditt kalas i Stockholm.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF8F3',
    theme_color: '#1A1A2E',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/og-default.png',
        sizes: '1200x630',
        type: 'image/png',
      },
    ],
  }
}
