// src/features/profile/hooks/useMyProfile.ts
'use client'

import { useEffect, useState } from 'react'
import { fetchMyProfile } from '@/features/profile/api/profile.api'

type MyProfile = {
  nickname?: string
  bio?: string
  level?: number
  profileImageUrl?: string
  genres?: string[]
  [key: string]: any
}

export function useMyProfile() {
  const [data, setData] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    const getAccessTokenWithRetry = async () => {
      // ✅ 리다이렉트 직후/rehydrate 직후 토큰이 늦게 들어올 수 있어 재시도
      const MAX_TRIES = 15 // 1.2초
      const INTERVAL_MS = 80

      for (let i = 0; i < MAX_TRIES; i++) {
        const token =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('accessToken')
            : null
        if (token && token.trim().length > 0) return token.trim()
        await sleep(INTERVAL_MS)
      }
      return null
    }

    const run = async () => {
      try {
        setLoading(true)
        setErrorMsg(null)

        const accessToken = await getAccessTokenWithRetry()

        if (!accessToken) {
          throw new Error('accessToken이 없습니다. 로그인 상태를 확인해주세요.')
        }

        // ✅ 백엔드 API가 없으니 fetchMyProfile은 sessionStorage(my-profile)에서 읽어옴
        const res = await fetchMyProfile(accessToken)

        if (!cancelled) setData(res as MyProfile)
      } catch (e) {
        if (!cancelled) {
          setData(null)
          setErrorMsg(e instanceof Error ? e.message : '알 수 없는 오류')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, errorMsg }
}
