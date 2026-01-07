// src/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'STORIX',
    short_name: 'STORIX',
    description: 'STORIX PWA',
    start_url: '/login', // 너 프로젝트는 / 가 /login으로 redirect라 이게 자연스러움
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/pwa/icon_192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/pwa/icon_512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
