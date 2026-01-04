// src/components/common/SearchBar.tsx
'use client'

import { useState, KeyboardEvent } from 'react'
import Link from 'next/link'

type SearchBarProps = {
  placeholder?: string
  backward?: string
  onSearchClick?: (keyword: string) => void
}

export default function SearchBar({
  placeholder = '좋아하는 작품/작가를 검색하세요',
  backward,
  onSearchClick,
}: SearchBarProps) {
  const [keyword, setKeyword] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchClick) {
      onSearchClick(keyword.trim())
    }
  }

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick(keyword.trim())
    }
  }

  return (
    <div className="flex h-17 w-full justify-between px-4 py-2.5 bg-white">
      {/* 상단 행: 화살표 / 텍스트 / 돋보기 */}
      <div className="flex w-full items-center gap-[15px]">
        <Link
          href={`/${backward}`}
          aria-label="홈으로 이동"
          className="flex h-6 w-6 items-center justify-center"
        >
          <BackIcon />
        </Link>

        <div className="flex flex-col w-full">
          <div>
            <div className="flex px-2 justify-between">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent body-1 placeholder:text-gray-400 outline-none"
              />
              <button
                type="button"
                aria-label="검색"
                onClick={handleSearchClick}
                className="flex h-6 w-6 items-center justify-center"
              >
                <SearchIcon />
              </button>
            </div>
          </div>
          <div>
            {/* 하단 언더라인 */}
            <div className="mt-[10px] h-[2px] w-full bg-black" />
          </div>
        </div>
      </div>
    </div>
  )
}
/* ===== 아이콘들 ===== */

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3.54922 11.9996L10.8992 19.3496C11.1492 19.5996 11.2701 19.8913 11.2617 20.2246C11.2534 20.558 11.1242 20.8496 10.8742 21.0996C10.6242 21.3496 10.3326 21.4746 9.99922 21.4746C9.66589 21.4746 9.37422 21.3496 9.12422 21.0996L1.42422 13.4246C1.22422 13.2246 1.07422 12.9996 0.974219 12.7496C0.874219 12.4996 0.824219 12.2496 0.824219 11.9996C0.824219 11.7496 0.874219 11.4996 0.974219 11.2496C1.07422 10.9996 1.22422 10.7746 1.42422 10.5746L9.12422 2.87462C9.37422 2.62462 9.67005 2.50379 10.0117 2.51212C10.3534 2.52046 10.6492 2.64962 10.8992 2.89962C11.1492 3.14962 11.2742 3.44129 11.2742 3.77462C11.2742 4.10796 11.1492 4.39962 10.8992 4.64962L3.54922 11.9996Z"
        fill="#100F0F"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M6.5 13C4.68333 13 3.14583 12.3708 1.8875 11.1125C0.629167 9.85417 0 8.31667 0 6.5C0 4.68333 0.629167 3.14583 1.8875 1.8875C3.14583 0.629167 4.68333 0 6.5 0C8.31667 0 9.85417 0.629167 11.1125 1.8875C12.3708 3.14583 13 4.68333 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L17.3 15.9C17.4833 16.0833 17.575 16.3167 17.575 16.6C17.575 16.8833 17.4833 17.1167 17.3 17.3C17.1167 17.4833 16.8833 17.575 16.6 17.575C16.3167 17.575 16.0833 17.4833 15.9 17.3L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13ZM6.5 11C7.75 11 8.8125 10.5625 9.6875 9.6875C10.5625 8.8125 11 7.75 11 6.5C11 5.25 10.5625 4.1875 9.6875 3.3125C8.8125 2.4375 7.75 2 6.5 2C5.25 2 4.1875 2.4375 3.3125 3.3125C2.4375 4.1875 2 5.25 2 6.5C2 7.75 2.4375 8.8125 3.3125 9.6875C4.1875 10.5625 5.25 11 6.5 11Z"
        fill="#100F0F"
      />
    </svg>
  )
}
