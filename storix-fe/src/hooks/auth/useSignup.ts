// src/hooks/auth/useSignup.ts
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { signup } from '@/api/auth/signup.api'
import { useAuthStore } from '@/store/auth.store'
import type { SignupRequest } from '@/api/auth/auth.schema'
import { AxiosError } from 'axios'

export const useSignup = () => {
  const router = useRouter()

  const onboardingToken = useAuthStore((s) => s.onboardingToken)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      const onboardingToken = useAuthStore.getState().onboardingToken
      if (!onboardingToken) throw new Error('Onboarding token is missing')
      return signup(data, onboardingToken)
    },

    onSuccess: async (response) => {
      const token = response.result.accessToken
      setAccessToken(token)

      // ✅ 온보딩(회원가입) 완료 직후: manual 노출 → manual에서 home으로
      router.replace('/manual')
    },

    onError: (error: AxiosError) => {
      console.error('회원가입 실패:', error)
      clearAuth()
      alert('회원가입에 실패했습니다. 다시 시도해주세요.')
    },
  })
}
