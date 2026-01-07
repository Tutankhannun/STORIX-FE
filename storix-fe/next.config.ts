// next.config.ts
import { spawnSync } from 'node:child_process'
import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf-8',
  }).stdout?.trim() ?? crypto.randomUUID()

const withSerwist = withSerwistInit({
  // ✅ 서비스워커 소스(네가 작성하는 파일)
  swSrc: 'src/app/sw.ts',
  // ✅ 빌드 결과가 public/sw.js 로 생성됨 (정적 파일)
  swDest: 'public/sw.js',

  // ✅ 개발 중에는 꺼두는 게 안정적 (캐시 꼬임 방지)
  disable: process.env.NODE_ENV !== 'production',

  // (선택) 오프라인 fallback 페이지도 프리캐시
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
})

const nextConfig: NextConfig = {
  // 기존 설정 유지
}

export default withSerwist(nextConfig)
