// src/app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

export default function Home() {
  const router = useRouter()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL
        if (!baseURL) {
          // 환경변수 누락이면 안전하게 로그인으로
          router.replace('/login')
          return
        }

        // ✅ /login 가기 전에 refresh 먼저 시도
        // - 쿠키(리프레시 토큰)가 있으면 새 accessToken이 내려옴
        // - 쿠키 없으면 보통 401/4xx
        const res = await axios.post(
          `${baseURL}/api/v1/auth/tokens/refresh`,
          {},
          {
            withCredentials: true,
            // ✅ 4xx도 throw 안 하게 (쿠키 없을 때 정상 분기 처리)
            validateStatus: (status) => status >= 200 && status < 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )

        const newAccessToken = (res.data as any)?.result?.accessToken

        // ✅ refresh 성공 → 바로 /home
        if (res.status >= 200 && res.status < 300 && newAccessToken) {
          if (!mounted) return
          setAccessToken(String(newAccessToken))
          router.replace('/home')
          return
        }

        // ✅ 쿠키 없거나 refresh 실패 → /login
        router.replace('/login')
      } catch {
        // 네트워크/서버 에러 → /login
        router.replace('/login')
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [router, setAccessToken])

  // 짧게 로딩 화면
  return (
    <div className="w-full h-full flex items-center justify-center">
      <p
        className="text-[16px] font-medium"
        style={{ color: 'var(--color-gray-700)' }}
      >
        로딩 중...
      </p>
    </div>
  )
}
