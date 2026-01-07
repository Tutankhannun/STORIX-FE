// src/api/auth/nickname.api.ts
import { apiClient } from '../axios-instance'
import { z } from 'zod'

/**
 * ✅ /api/v1/auth/nickname/valid 응답 스키마
 * - 백엔드가 result를 안 내려줄 수도 있어서 optional 처리
 */
export const NicknameValidResponseSchema = z.object({
  isSuccess: z.boolean(),
  code: z.string(),
  message: z.string(),
  result: z.unknown().optional(),
  timestamp: z.string(),
})

export type NicknameValidResponse = z.infer<typeof NicknameValidResponseSchema>

/**
 * ✅ 금칙어 체크 응답 스키마 (엔드포인트/응답 확정 전이므로 안전하게 optional)
 */
export const NicknameForbiddenResponseSchema = z.object({
  isSuccess: z.boolean(),
  code: z.string(),
  message: z.string(),
  result: z.unknown().optional(),
  timestamp: z.string(),
})

export type NicknameForbiddenResponse = z.infer<
  typeof NicknameForbiddenResponseSchema
>

/**
 * ✅ 닉네임 중복 체크 (버튼 클릭시에만 호출)
 * - 명세: GET /api/v1/auth/nickname/valid?nickname=...
 * - 중복 같은 케이스가 4xx로 내려오면 axios가 throw 하므로,
 *   validateStatus로 4xx도 "정상 응답처럼" 받아서 UI에서 분기 처리하게 함
 */
export const checkNicknameValid = async (
  nickname: string,
): Promise<NicknameValidResponse> => {
  const response = await apiClient.get('/api/v1/auth/nickname/valid', {
    params: { nickname }, // ✅ 명세 그대로
    validateStatus: (status) => status >= 200 && status < 500, // ✅ 4xx도 처리
  })

  return NicknameValidResponseSchema.parse(response.data)
}

/**
 * ✅ 금칙어 체크 (debounce로 호출)
 * ⚠️ 백엔드 엔드포인트/응답 확정 전에는 401/404 날 수 있음.
 *     (Nickname 컴포넌트에서 호출을 막는 걸 추천)
 */
export const checkNicknameForbidden = async (
  nickname: string,
): Promise<NicknameForbiddenResponse> => {
  const response = await apiClient.get('/api/v1/auth/nickname/forbidden', {
    params: { nickname },
    // 필요하면 여기도 4xx 허용 가능:
    // validateStatus: (status) => status >= 200 && status < 500,
  })

  return NicknameForbiddenResponseSchema.parse(response.data)
}

/**
 * ✅ “사용 가능” 판정: 확정된 code로만 판단 (가장 안정적)
 */
export const extractIsAvailableFromValidResponse = (
  data: NicknameValidResponse,
): boolean => {
  return data.isSuccess === true && data.code === 'NICKNAME_SUCCESS_001'
}

/**ㅞㅡ
 * ✅ “이미 사용 중(중복)” 판정: 확정된 code로 판단
 * (Nickname 컴포넌트에서 분기할 때 쓰면 더 명확해짐)
 */
export const extractIsDuplicatedFromValidResponse = (
  data: NicknameValidResponse,
): boolean => {
  return data.isSuccess === false && data.code === 'NICKNAME_ERROR_001'
}
