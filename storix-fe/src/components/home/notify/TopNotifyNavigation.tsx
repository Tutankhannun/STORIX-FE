// src/components/home/notify/TopNotifyNavigation.tsx
'use client'

import Link from 'next/link'

export default function TopNotifyNavigation() {
  return (
    <div className="flex h-17 w-full justify-center items-center px-4 py-2.5 bg-white">
      {/* 상단 행: 화살표 / 텍스트 / 돋보기 */}
      <Link
        href={'/home'}
        aria-label="홈으로 이동"
        className="flex h-6 w-6 items-center justify-center"
      >
        <img src="/icons/back.svg" alt="????" width="24" height="24" loading="lazy" />
      </Link>
      <div className="flex w-full h-full justify-center items-center -translate-x-1.5">
        <p className="body-1 font-gray-900">알림</p>
      </div>
    </div>
  )
}
