// src/features/profile/api/profile.api.ts

export type ProfileResponse = {
  nickname: string
  bio?: string
  level?: number
  profileImageUrl?: string
  genres?: string[] // ✅ 선호장르가 있으면 여기로
  [key: string]: any
}

/**
 * ✅ 백엔드에 "내 프로필 조회" API가 없으므로,
 * 프론트에서 회원가입 시 저장해둔 값을 sessionStorage에서 읽어 프로필로 사용한다.
 *
 * 저장 포맷(예시):
 * sessionStorage.setItem('my-profile', JSON.stringify({ nickname, genres, bio, ... }))
 */
export async function fetchMyProfile(
  accessToken: string,
): Promise<ProfileResponse> {
  const token = accessToken?.trim()
  if (!token)
    throw new Error('accessToken이 없습니다. 로그인 상태를 확인해주세요.')

  if (typeof window === 'undefined') {
    throw new Error('클라이언트 환경에서만 프로필을 불러올 수 있습니다.')
  }

  const raw = sessionStorage.getItem('my-profile')
  if (!raw) {
    // ✅ 백엔드 API가 없으니, 저장된 게 없으면 여기서 막혀.
    //    (회원가입 완료 시점에 my-profile을 저장하도록 해줘야 함)
    throw new Error(
      '저장된 프로필 정보가 없습니다. 회원가입(온보딩)에서 닉네임/선호장르 저장 로직을 확인해주세요.',
    )
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProfileResponse>

    // 최소 필수값 보정
    return {
      nickname: parsed.nickname ?? '닉네임',
      bio: parsed.bio ?? '',
      level: parsed.level ?? 1,
      profileImageUrl: parsed.profileImageUrl,
      genres: parsed.genres ?? [],
      ...parsed,
    }
  } catch {
    throw new Error(
      '저장된 프로필 정보 형식이 올바르지 않습니다. sessionStorage의 my-profile 값을 확인해주세요.',
    )
  }
}
