// src/components/library/LibraryHeader.tsx
'use client'

import Link from 'next/link'

/** 상단 페이지+ 검색 */
export default function LibraryHeader() {
  return (
    <header className="flex py-4 px-4 items-center justify-between">
      {/* 왼쪽 */}
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
          <img src="/common/icons/search.svg" alt="??" width="24" height="24" className="inline-block" loading="lazy" />
        </Link>
      </div>
    </header>
  )
}
