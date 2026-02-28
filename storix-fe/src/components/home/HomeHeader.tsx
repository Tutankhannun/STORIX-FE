// src/components/home/HomeHeader.tsx
'use client'

import Link from 'next/link'

/* 상단 로고 + 검색 + 알림 헤더 */
export default function HomeHeader() {
  return (
    <header className="flex py-4 items-center justify-between">
      {/* 왼쪽 로고 버튼 */}
      <div className="flex h-10 w-10 items-center justify-center">
        <img src="/icons/logo-black.svg" alt="STORIX" width="40" height="40" />
      </div>

      {/* 오른쪽 아이콘 그룹 */}
      <div className="flex items-center gap-4">
        {/* 검색 아이콘 */}
        <Link
          href={'/home/search'}
          aria-label="Search"
          className="flex h-6 w-6 items-center justify-center"
        >
          <img
            src="/common/icons/search.svg"
            alt="STORIX"
            width="24"
            height="24"
            loading="lazy"
          />
        </Link>

        {/* 알림 아이콘 */}
        <Link
          href={'/home/notify'}
          aria-label="Notifications"
          className="flex h-6 w-6 items-center justify-center"
        >
          <img
            src="/common/icons/notification.svg"
            alt="STORIX"
            width="24"
            height="24"
            loading="lazy"
          />
        </Link>
      </div>
    </header>
  )
}
