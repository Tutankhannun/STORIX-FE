// src/hooks/auth/useKakaoLogin.ts
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { kakaoLogin } from '@/api/auth/kakao.api'
import { useAuthStore } from '@/store/auth.store'
import type { KakaoLoginResponse } from '@/api/auth/auth.schema'
import { AxiosError } from 'axios'

export const useKakaoLogin = () => {
  const router = useRouter()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const setOnboardingToken = useAuthStore((s) => s.setOnboardingToken)

  return useMutation({
    mutationFn: (code: string) => kakaoLogin(code),
    onSuccess: (data: KakaoLoginResponse) => {
      console.log('✅ 카카오 로그인 응답:', data)

      const { isRegistered, readerLoginResponse, readerPreLoginResponse } =
        data.result

      // ✅ isRegistered 기준 분기 (요구사항)
      // true  -> 홈
      // false -> 이용약관
      if (isRegistered && readerLoginResponse?.accessToken) {
        setAccessToken(readerLoginResponse.accessToken)
        router.push('/home')
        return
      }

      if (!isRegistered && readerPreLoginResponse?.onboardingToken) {
        setOnboardingToken(readerPreLoginResponse.onboardingToken)
        router.push('/agreement')
        return
      }

      console.error('⚠️ 예상치 못한 응답 형식:', data)
      alert('로그인 처리 중 오류가 발생했습니다.')
    },
    onError: (error: AxiosError) => {
      console.error('❌ 카카오 로그인 실패:', error)
      console.error('에러 상세:', error.response?.data)
      alert('로그인에 실패했습니다. 다시 시도해주세요.')
      router.push('/login')
    },
  })
}
