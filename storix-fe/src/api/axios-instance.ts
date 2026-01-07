// src/api/axios-instance.ts
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import { useAuthStore } from '@/store/auth.store'

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: true, // ✅ 배포환경에서 refreshToken 쿠키 전송
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✅ Axios v1 헤더( AxiosHeaders )까지 고려해서 Authorization 읽기
const getAuthHeader = (headers: any): string | undefined => {
  if (!headers) return undefined
  // AxiosHeaders
  if (typeof headers.get === 'function') {
    const v = headers.get('Authorization')
    return typeof v === 'string' && v.length > 0 ? v : undefined
  }
  // plain object (대/소문자 모두)
  return (
    (typeof headers.Authorization === 'string' && headers.Authorization) ||
    (typeof headers.authorization === 'string' && headers.authorization) ||
    undefined
  )
}

const setAuthHeader = (headers: any, value: string) => {
  if (!headers) return
  if (typeof headers.set === 'function') {
    headers.set('Authorization', value)
    return
  }
  headers.Authorization = value
}

// ✅ refresh/로그인/회원가입 같은 “비로그인 단계” 요청은 refresh 로직 금지
const isNoRefreshEndpoint = (url?: string) => {
  if (!url) return false
  // baseURL 붙기 전/후 모두 대비해서 includes로 처리
  return (
    url.includes('/api/v1/auth/users/reader/signup') ||
    url.includes('/api/v1/auth/tokens/refresh') ||
    url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/oauth') ||
    url.includes('/api/v1/auth/users') ||
    url.includes('/api/v1/auth/nickname')
  )
}

// Request Interceptor: Access Token 자동 추가
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState()
    if (!config.headers) return config

    // ✅ signup 등에서 Authorization을 직접 넣은 경우 -> 그대로 둔다 (정확히 체크)
    const existingAuth = getAuthHeader(config.headers)
    const hasAuthHeader =
      typeof existingAuth === 'string' && existingAuth.length > 0

    if (!hasAuthHeader && accessToken) {
      setAuthHeader(config.headers, `Bearer ${accessToken}`)
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// Response Interceptor: Token Refresh 자동 처리
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // ✅ refresh 금지 endpoint면 바로 에러 반환 (온보딩/회원가입에서 refresh 타지 않게)
    if (isNoRefreshEndpoint(originalRequest?.url)) {
      return Promise.reject(error)
    }

    // 401 에러 && 재시도 안 한 경우
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/tokens/refresh`,
          {},
          { withCredentials: true },
        )

        const newAccessToken = (response.data as any)?.result?.accessToken
        if (!newAccessToken) throw new Error('Refresh succeeded but no token')

        // Zustand store에 새 토큰 저장
        useAuthStore.getState().setAccessToken(newAccessToken)

        // 원래 요청에 새 토큰 적용 후 재시도
        if (originalRequest.headers) {
          setAuthHeader(originalRequest.headers, `Bearer ${newAccessToken}`)
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        // ✅ 여기서도 “온보딩/회원가입 흐름”이면 clearAuth/리다이렉트 금지
        // (혹시라도 url 매칭이 새어도 안전하게)
        if (isNoRefreshEndpoint(originalRequest?.url)) {
          return Promise.reject(refreshError)
        }

        useAuthStore.getState().clearAuth()

        // if (typeof window !== 'undefined') {
        //   window.location.href = '/login'
        // }

        // after (window 식별자 직접 참조 X)
        if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
          ;(globalThis as any).window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
