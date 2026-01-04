// src/components/common/NavBar.tsx
'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import IconFeed from '@/public/icons/navbar/Icon-Feed'
import IconHome from '@/public/icons/navbar/Icon-Home'
import IconLibrary from '@/public/icons/navbar/Icon-Library'
import IconProfile from '@/public/icons/navbar/Icon-Profile'

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
  library: '/library',
  profile: '/profile',
}

export default function NavBar({ active, onChange }: NavBarProps) {
  const router = useRouter()
  const [isPlusOpen, setIsPlusOpen] = useState(false)

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
        className="flex flex-col items-center justify-center caption-1 px-3"
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
    <div className="min-[360px]:fixed max-[360px]:relative z-50 w-full max-w-[393px] bottom-0 left-1/2 -translate-x-1/2 ">
      <div className="relative w-full">
        <nav className="relative z-10 flex h-24 w-full items-start px-5 pt-[15px] pb-3">
          {/* 왼쪽 두 개: gap-4 = 16px */}
          <div className="flex items-center gap-5">
            {NAV_ITEMS.slice(0, 2).map(renderItem)}
          </div>

          {/* 가운데는 자동으로 넓게 차지 */}
          <div className="flex-1" />

          {/* 오른쪽 두 개: gap-4 = 16px */}
          <div className="flex items-center gap-5">
            {NAV_ITEMS.slice(2).map(renderItem)}
          </div>
        </nav>
        <div className="fixed w-full max-w-[393px] bottom-0 left-1/2 -translate-x-1/2">
          <Image
            src="/icons/navbar/navigationbar-background.svg"
            alt="네비게이션 바 배경"
            width={393}
            height={100}
          />
        </div>
        {/* 플로팅 탭 */}
        {isPlusOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              width: 162,
              height: 98,
              bottom: 72 + 56 + 12,
            }}
          >
            <Image
              src="icons/navbar/plus-floating-tab.svg"
              alt="플러스 플로팅 탭"
              width={162}
              height={98}
              className="w-[162px] h-[98px]"
              priority
            />
          </div>
        )}

        {/* 플러스 버튼 */}
        <button
          type="button"
          onClick={handlePlusClick}
          className={[
            'absolute left-1/2 -translate-x-1/2 bottom-18',
            'w-14 h-14',
            'transition-transform duration-200 ease-in-out',
            'hover:opacity-70',
            isPlusOpen ? 'rotate-90' : 'rotate-0',
          ].join(' ')}
          aria-label="추가"
          aria-expanded={isPlusOpen}
        >
          <Image
            src="/icons/navbar/plus.svg"
            alt="플러스"
            width={56}
            height={56}
            className="w-[56px] h-[56px]"
            priority
          />
        </button>
      </div>
    </div>
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
