import { apiClient } from '../axios-instance'
import {
  KakaoLoginResponseSchema,
  type KakaoLoginResponse,
} from './auth.schema'

// 카카오 인가 URL 가져오기 (Next.js API Route 통해서)
export const getKakaoAuthUrl = async (): Promise<string> => {
  const response = await fetch('/api/auth/kakao/authorization-url')
  const data = await response.json()
  return data.url
}

// 카카오 로그인 (백엔드 API 호출)
export const kakaoLogin = async (code: string): Promise<KakaoLoginResponse> => {
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
  //|| 'http://localhost:3000/login'

  const response = await apiClient.get('/api/v1/auth/oauth/kakao/login', {
    params: {
      code,
      redirectUri,
    },
  })

  // Zod로 응답 검증
  return KakaoLoginResponseSchema.parse(response.data)
}
