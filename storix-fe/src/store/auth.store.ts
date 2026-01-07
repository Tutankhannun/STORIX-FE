// src/store/auth.store.ts

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  onboardingToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  marketingAgree: boolean

  setAccessToken: (token: string) => void
  setOnboardingToken: (token: string) => void
  setMarketingAgree: (agree: boolean) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        accessToken: null,
        onboardingToken: null,
        isAuthenticated: false,
        isLoading: false,
        marketingAgree: false,

        setAccessToken: (token) => {
          // ✅ (중요) 기존 코드/훅들이 sessionStorage.getItem('accessToken')로 읽는 경우를 위해
          //     accessToken 키도 같이 저장해준다.
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('accessToken', token)
          }

          set({
            accessToken: token,
            isAuthenticated: true,
            onboardingToken: null,
          })
        },

        setOnboardingToken: (token) => {
          // 온보딩 토큰으로 전환 시 accessToken 키 제거(혼동 방지)
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('accessToken')
          }

          set({
            onboardingToken: token,
            isAuthenticated: false,
            accessToken: null,
          })
        },

        setMarketingAgree: (agree) => set({ marketingAgree: agree }),

        clearAuth: () => {
          // ✅ accessToken 키도 제거
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('accessToken')
          }

          set({
            accessToken: null,
            onboardingToken: null,
            isAuthenticated: false,
            marketingAgree: false,
          })
        },

        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: 'auth-storage',
        // ✅ SSR 안전 가드: window 없을 때 sessionStorage 접근 방지
        storage: createJSONStorage(() => {
          if (typeof window === 'undefined') {
            // SSR에서는 storage 사용 불가 -> 더미로 처리
            // (persist는 클라이언트에서만 실제로 동작)
            return {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          }
          return sessionStorage
        }),
        partialize: (state) => ({
          accessToken: state.accessToken,
          onboardingToken: state.onboardingToken,
          marketingAgree: state.marketingAgree,
        }),
        // ✅ rehydrate 후 isAuthenticated를 accessToken 유무로 맞춰줌
        onRehydrateStorage: () => (state) => {
          if (!state) return
          state.isAuthenticated = !!state.accessToken
        },
      },
    ),
    { name: 'auth-store' },
  ),
)
