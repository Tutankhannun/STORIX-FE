// src/app/profile/settings/SettingsClient.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { withdrawUser } from '@/api/auth/withdraw.api'
import { useAuthStore } from '@/store/auth.store'

export default function SettingsClient() {
  const router = useRouter()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleWithdraw = async () => {
    const ok =
      typeof window !== 'undefined' &&
      window.confirm(
        '회원 탈퇴 시 계정 정보는 복구할 수 없어요.\n정말 탈퇴하시겠어요?',
      )

    if (!ok) return

    try {
      await withdrawUser()
      // ✅ 인증 정보 정리
      clearAuth()
      // ✅ 로그인 페이지로 이동
      router.replace('/login')
    } catch {
      alert('회원 탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    // ✅ 배포 모바일에서 회색 비침 방지 + ✅ NavBar 가림 방지
    <div className="min-h-full w-full bg-white">
      <div className="h-[54px]" />

      {/* 헤더 */}
      <div className="px-4 py-2">
        <div className="relative flex h-10 items-center justify-center">
          {/* 뒤로가기 */}
          <Link
            href="/profile"
            className="absolute left-0 flex h-10 w-10 items-center justify-center"
          >
            <Image
              src="/icons/back.svg"
              alt="뒤로가기"
              width={24}
              height={24}
            />
          </Link>

          <h1 className="text-[16px] font-medium leading-[140%] text-[var(--color-gray-900)]">
            설정
          </h1>
        </div>
      </div>

      {/* 설정 컨텐츠 (여기부터 기존 코드 유지) */}
      <div className="px-4 py-8">
        <button
          type="button"
          onClick={handleWithdraw}
          className="h-[50px] w-full rounded-md border border-[var(--color-warning)] text-[14px] font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-warning)' }}
        >
          회원탈퇴
        </button>
      </div>
    </div>
  )
}
