'use client'

import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { RefObject } from 'react'
import type { WorksSearchItem } from '@/lib/api/search/search.schema'
import Warning from '@/components/common/Warining'

type Props = {
  works: WorksSearchItem[]
  isFetching?: boolean
  loadMoreRef?: RefObject<HTMLDivElement | null>
}

export default function SearchResultWorks({
  works,
  isFetching = false,
  loadMoreRef,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const returnTo = encodeURIComponent(
    `${pathname}${sp.toString() ? `?${sp.toString()}` : ''}`,
  )
  const onClickWorks = (worksId: number) => {
    router.push(`/library/works/${worksId}?returnTo=${returnTo}`)
  }
  return (
    <section className="flex w-full flex-col gap-3">
      {works.length > 0 ? (
        <div className="flex flex-col">
          {works.map((w, idx) => (
            <button
              key={w.worksId}
              type="button"
              onClick={() => onClickWorks(w.worksId)}
              className="flex w-full gap-4 border-b border-gray-100 p-4 hover:opacity-90 cursor-pointer text-left"
            >
              {/* 썸네일 */}
              <div className="relative h-[116px] w-[87px] shrink-0 overflow-hidden rounded-sm bg-gray-100 ">
                {w.thumbnailUrl ? (
                  <Image
                    src={w.thumbnailUrl}
                    alt={w.worksName}
                    fill
                    sizes="87px"
                    priority={idx < 2}
                    loading={idx < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="object-cover"
                  />
                ) : null}
              </div>

              {/* 텍스트 */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate body-1 text-black">{w.worksName}</p>

                <p className="truncate body-2 text-gray-500">
                  {w.artistName}
                  <span className="mx-2 text-gray-300">·</span>
                  {w.worksType}
                </p>

                <div className="flex items-center gap-2">
                  <span className="caption-1 text-[var(--color-magenta-300)]">
                    <img src="/search/littleStar.svg" alt="star icon" width="9" height="10" className="inline-block mr-1 mb-0.5" loading="lazy" />
                    {Number(w.avgRating).toFixed(1)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Warning
          title="검색 결과가 없습니다"
          description="다른 키워드로 검색해보세요."
          className="mt-48"
        />
      )}

      {loadMoreRef ? <div ref={loadMoreRef} className="h-6 w-full" /> : null}
    </section>
  )
}
