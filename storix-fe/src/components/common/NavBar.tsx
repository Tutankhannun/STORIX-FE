// src/components/common/NavBar.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReviewWriteBottomSheet from '@/components/home/bottomsheet/ReviewWriteBottomSheet'
import IconFeed from '@/public/common/icons/navbar/Icon-Feed'
import IconHome from '@/public/common/icons/navbar/Icon-Home'
import IconLibrary from '@/public/common/icons/navbar/Icon-Library'
import IconProfile from '@/public/common/icons/navbar/Icon-Profile'

type NavKey = 'home' | 'feed' | 'library' | 'profile'

type NavBarProps = {
  active: NavKey
  onChange?: (next: NavKey) => void
}

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'home', label: '홈' },
  { key: 'feed', label: '피드' },
  { key: 'library', label: '서재' },
  { key: 'profile', label: '프로필' },
]

const ROUTES: Record<NavKey, string> = {
  home: '/home',
  feed: '/feed',
  library: '/library/list',
  profile: '/profile',
}

export default function NavBar({ active, onChange }: NavBarProps) {
  const router = useRouter()
  const [isPlusOpen, setIsPlusOpen] = useState(false)
  const [showReviewSheet, setShowReviewSheet] = useState(false)
  const [showFeedSheet, setShowFeedSheet] = useState(false)

  const handlePlusClick = () => {
    setIsPlusOpen((prev) => !prev)
  }

  const handleNavClick = (key: NavKey) => {
    onChange?.(key)

    const href = ROUTES[key]
    if (href !== '#') {
      router.push(href)
    }
  }

  const renderItem = (item: { key: NavKey; label: string }) => {
    const isActive = active === item.key

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => handleNavClick(item.key)}
        className="flex cursor-pointer flex-col items-center justify-center caption-1 px-3"
      >
        <div className="mb-1 flex h-6 w-6 items-center justify-center">
          <span className={isActive ? 'text-gray-900' : 'text-gray-300'}>
            {iconByName(item.key)}
          </span>
        </div>
        <span className={isActive ? 'text-gray-900' : 'text-gray-300'}>
          {item.label}
        </span>
      </button>
    )
  }

  return (
    <>
      {/*   plus 열렸을 때: nav 밖 클릭으로 닫히게 + 뒤 화면 클릭 막기 */}
      {isPlusOpen && (
        <button
          type="button"
          aria-label="닫기 오버레이"
          onClick={() => setIsPlusOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-transparent"
        />
      )}

      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[393px] -translate-x-1/2">
        <div className="relative w-full">
          <nav className="relative z-10 flex h-20 w-full items-start px-5 pt-[15px] pb-3">
            <div className="flex items-center gap-5">
              {NAV_ITEMS.slice(0, 2).map(renderItem)}
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-5">
              {NAV_ITEMS.slice(2).map(renderItem)}
            </div>
          </nav>

          <div className="absolute inset-x-0 bottom-0 h-[80px]">
            <img src="/common/icons/navbar/navigationbar-background.svg" alt="?????? ??" width="393" height="80" loading="lazy" />
          </div>

          {/* 플로팅 탭 */}
          {isPlusOpen && (
            <div
              className="absolute left-1/2 z-50 -translate-x-1/2"
              style={{
                width: 162,
                height: 98,
                bottom: 130,
              }}
            >
              <div className="w-40.5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_10px_0_rgba(0,0,0,0.25)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusOpen(false)
                    setShowReviewSheet(true)
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 border-b border-gray-200 hover:opacity-70 cursor-pointer"
                >
                  <span className="body-1 text-gray-800">리뷰 작성</span>
                  <img src="/common/icons/navbar/review.svg" alt="?? ??" width="28" height="28" loading="lazy" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlusOpen(false)
                    router.push('/feed/write')
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 hover:opacity-70 cursor-pointer"
                >
                  <span className="body-1 text-gray-800">피드 작성</span>
                  <img src="/common/icons/navbar/feed.svg" alt="?? ??" width="28" height="28" loading="lazy" />
                </button>
              </div>
            </div>
          )}

          {/* 플러스 버튼 */}
          <button
            type="button"
            onClick={handlePlusClick}
            className={[
              'absolute left-1/2 z-50 -translate-x-1/2',
              'w-14 h-14',
              'cursor-pointer', //   다른 아이콘처럼 커서 변경
              'transition-transform duration-200 ease-in-out',
              'hover:opacity-80 cursor-pointer',
              isPlusOpen ? 'rotate-90' : 'rotate-0',
            ].join(' ')}
            style={{ bottom: 50 }}
            aria-label="추가"
            aria-expanded={isPlusOpen}
          >
            <img src="/common/icons/navbar/plus.svg" alt="???" width="56" height="56" className="h-[56px] w-[56px]" loading="lazy" />
          </button>
        </div>
      </div>

      {showReviewSheet && (
        <ReviewWriteBottomSheet onClose={() => setShowReviewSheet(false)} />
      )}
    </>
  )
}

/** 아이콘 자리 구분용 네이밍 */
function iconByName(key: NavKey) {
  switch (key) {
    case 'home':
      return <IconHome />
    case 'feed':
      return <IconFeed />
    case 'library':
      return <IconLibrary />
    case 'profile':
      return <IconProfile />
  }
}
