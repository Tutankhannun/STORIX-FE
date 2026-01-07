// src/api/auth/withdraw.api.ts
import { apiClient } from '../axios-instance'
import { WithdrawResponseSchema, type WithdrawResponse } from './auth.schema'

// 회원 탈퇴
export const withdrawUser = async (): Promise<WithdrawResponse> => {
  const response = await apiClient.delete('/api/v1/auth/user/withdraw')
  return WithdrawResponseSchema.parse(response.data)
}
