// src/components/home/search/TrendingSearch.tsx
'use client'

import { useMemo } from 'react'
import { useTrendingKeywords } from '@/hooks/search/useSearch'

type Props = {
  onSelect?: (keyword: string) => void
  className?: string
}

export default function TrendingSearch({ onSelect, className = '' }: Props) {
  const { data, isLoading, isError } = useTrendingKeywords()

  //   응답 래핑 케이스 방어 (result / result.result)
  const list = useMemo(() => {
    const raw =
      (data as any)?.result?.trendingKeywords ??
      (data as any)?.result?.result?.trendingKeywords ??
      []
    // rank 기준 정렬
    return Array.isArray(raw)
      ? [...raw].sort((a, b) => Number(a.rank) - Number(b.rank))
      : []
  }, [data])

  //   1~10위만
  const top10 = list.slice(0, 10)

  const left = top10.slice(0, 5)
  const right = top10.slice(5, 10)

  const renderRow = (item: any) => {
    const rank = Number(item.rank)
    const keyword = String(item.keyword ?? '')
    const status = String(item.status ?? '').toUpperCase()

    const isUp = status.includes('UP')
    const isDown = status.includes('DOWN')

    return (
      <button
        key={`${rank}-${keyword}`}
        type="button"
        onClick={() => onSelect?.(keyword)}
        className="flex w-full items-center justify-between pb-3 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={[
              'body-2 font-semibold inline-flex w-[2ch] justify-center',
              rank <= 3 ? 'text-[var(--color-magenta-300)]' : 'text-black',
            ].join(' ')}
          >
            {rank}
          </span>

          <span className="body-2 text-black truncate">{keyword}</span>
        </div>

        <div className="flex items-center justify-end w-5">
          {isUp ? (
            <img
              src="/search/trendingUp.svg"
              alt="상승"
              width="16"
              height="16"
              loading="lazy"
            />
          ) : isDown ? (
            <img
              src="/search/trendingDown.svg"
              alt="하락"
              width="16"
              height="16"
              loading="lazy"
            />
          ) : (
            // 변동 없음이면 자리만 유지
            <div className="h-4 w-4" />
          )}
        </div>
      </button>
    )
  }

  return (
    <section className={`w-full ${className}`}>
      <p className="body-1 text-black">인기 검색어</p>

      <div className="mt-3 w-full bg-white">
        {isLoading ? (
          <div className="py-6">
            <p className="body-2 text-gray-500">불러오는 중…</p>
          </div>
        ) : isError ? (
          <div className="py-6">
            <p className="body-2 text-gray-500">
              인기 검색어를 불러오지 못했어요.
            </p>
          </div>
        ) : top10.length === 0 ? (
          <div className="py-6">
            <p className="body-2 text-gray-500">인기 검색어가 없어요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8">
            <div className="">{left.map(renderRow)}</div>
            <div className="">{right.map(renderRow)}</div>
          </div>
        )}
      </div>
    </section>
  )
}
