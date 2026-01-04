// src/components/library/LibraryHeader.tsx
'use client'

import Link from 'next/link'
import SearchIcon from '@/public/icons/header/SearchIcon'

/** 상단 로고 + 검색 + 알림 헤더 */
export default function HomeHeader() {
  return (
    <header className="flex h-14 items-center justify-between">
      {/* 왼쪽 로고 버튼 */}
      <div className="flex items-center justify-center heading-2 text-gray-900">
        <p>내 서재</p>
      </div>

      {/* 오른쪽 아이콘 그룹 */}
      <div className="flex items-center gap-4">
        {/* 검색 아이콘 */}
        <Link
          href={'/library/search'}
          aria-label="검색"
          className="flex h-6 w-6 items-center justify-center"
        >
          <SearchIcon />
        </Link>
      </div>
    </header>
  )
}
