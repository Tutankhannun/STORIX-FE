// src/components/library/LibraryWorksListContent.tsx
'use client'

import Image from 'next/image'
import type { RefCallback } from 'react'

export type LibraryWorksListItem = {
  id: number
  title: string
  meta: string
  thumb: string
  rating?: number
}

export default function LibraryWorksListContent({
  isLoading,
  works,
  empty,
  onItemClick,
  infiniteScrollRef,
  isFetchingNextPage,
}: {
  isLoading: boolean
  works: LibraryWorksListItem[]
  empty: React.ReactNode
  onItemClick: (id: number) => void
  infiniteScrollRef?: RefCallback<Element>
  isFetchingNextPage?: boolean
}) {
  if (isLoading) {
    return (
      <div className="py-10 text-center body-2 text-gray-500">불러오는 중…</div>
    )
  }

  if (works.length === 0) {
    return <>{empty}</>
  }

  return (
    <div>
      {works.map((w, idx) => (
        <button
          key={w.id}
          type="button"
          onClick={() => onItemClick(w.id)}
          className="flex w-full gap-4 p-4 border-b border-gray-100 text-left hover:opacity-90 cursor-pointer"
        >
          {/* 썸네일 */}
          <div className="relative h-[116px] w-[87px] overflow-hidden rounded-sm bg-gray-100 flex-shrink-0">
            {w.thumb ? (
              <Image
                src={w.thumb}
                alt={w.title}
                fill
                sizes="87px"
                priority={idx < 2}
                loading={idx < 2 ? 'eager' : 'lazy'}
                decoding="async"
                className="object-cover"
              />
            ) : null}
          </div>

          {/* 텍스트 (ellipsis 패턴 유지) */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate body-1 text-black">{w.title}</p>
            <p className="truncate body-2 text-gray-500">{w.meta}</p>

            <div className="flex items-center gap-2">
              <span className="caption-1 font-extrabold text-pink-500">
                <img src="/search/littleStar.svg" alt="star icon" width="9" height="10" className="inline-block mr-1 mb-0.5" loading="lazy" />
                {Number(w.rating ?? 0).toFixed(1)}
              </span>
            </div>
          </div>
        </button>
      ))}

      {/* 무한 스크롤 센티넬 */}
      {infiniteScrollRef ? (
        <div ref={infiniteScrollRef} className="h-6" />
      ) : null}

      {isFetchingNextPage ? (
        <div className="py-4 text-center body-2 text-gray-500">
          더 불러오는 중…
        </div>
      ) : null}
    </div>
  )
}
