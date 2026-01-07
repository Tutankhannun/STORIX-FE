// src/api/auth/signup.api.ts

import { apiClient } from '../axios-instance'
import {
  SignupRequestSchema,
  SignupResponseSchema,
  type SignupRequest,
  type SignupResponse,
} from './auth.schema'

// 회원가입
export const signup = async (
  data: SignupRequest,
  onboardingToken: string,
): Promise<SignupResponse> => {
  const response = await apiClient.post(
    '/api/v1/auth/users/reader/signup',
    data,
    {
      headers: {
        Authorization: `Bearer ${onboardingToken.trim()}`,
      },
    },
  )

  // Zod로 응답 검증
  return SignupResponseSchema.parse(response.data)
}
