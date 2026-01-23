// src/api/profile/readerNickname.api.ts
import { apiClient } from '@/api/axios-instance'

export type ApiResponse<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

const parseAvailability = (result: unknown): boolean | null => {
  if (typeof result === 'boolean') return result
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>
    if (typeof r.isAvailable === 'boolean') return r.isAvailable
    if (typeof r.available === 'boolean') return r.available
    if (typeof r.duplicated === 'boolean') return !r.duplicated
    if (typeof r.isDuplicated === 'boolean') return !r.isDuplicated
  }
  return null
}

export const checkProfileNicknameValid = async (nickname: string) => {
  const res = await apiClient.get<ApiResponse<unknown>>(
    '/api/v1/profile/reader/nickname/valid',
    {
      params: { nickname },
      // ✅ 409/400이어도 throw 안 나게
      validateStatus: () => true,
    },
  )

  return {
    httpStatus: res.status,
    raw: res.data,
    available: parseAvailability(res.data?.result),
  }
}

export const updateProfileNickname = async (nickName: string) => {
  const res = await apiClient.post<ApiResponse<string>>(
    '/api/v1/profile/reader/nickname',
    { nickName },
  )
  return res.data
}
