// next.config.ts
import crypto from 'node:crypto'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf-8',
  }).stdout?.trim() ?? crypto.randomUUID()

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV !== 'production',
  additionalPrecacheEntries: [{ url: '/offline', revision }],
})

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  //  PWA/정적 자산 캐시 헤더 추가
  async headers() {
    return [
      //  manifest: 매번 재검증(max-age=0) 방지 → Edge Requests 급감
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },

      //  아이콘/SVG/PNG: 재요청 자체를 줄이기 위해 1년 캐시 + immutable
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/profile/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/common/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  images: {
    // dev에서는 S3 upstream timeout 때문에 next/image 최적화 끄기
    unoptimized:
      process.env.NEXT_PUBLIC_IMAGE_UNOPTIMIZED === 'true' ||
      process.env.NODE_ENV === 'development',

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd3rtpnzvkc675z.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'page-images.kakaoentcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shared-comic.pstatic.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'comicthumb-phinf.pstatic.net',
        pathname: '/**',
      },

      { protocol: 'https', hostname: 'img.ridicdn.net', pathname: '/**' },

      {
        protocol: 'https',
        hostname: 'image-comic.pstatic.net',
        pathname: '/**',
      },

      {
        protocol: 'https',
        hostname:
          'storix-ceos22-begsfeyc07-ds74eslk.s3.ap-southeast-2.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
}

export default withSerwist(nextConfig)
