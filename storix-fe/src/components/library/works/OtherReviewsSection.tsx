// src/components/library/works/OtherReviewsSection.tsx
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ForwardArrowIcon from '@/public/icons/layout/FowardArrowIcon'

type OtherReviewItem = {
  reviewId: number
  userName?: string
  content?: string
  profileImageUrl?: string | null
}

type Props = {
  otherReviews: OtherReviewItem[]
  sentinelRef: (node?: Element | null) => void //   useInView의 ref 그대로 받기
}

export default function OtherReviewsSection({
  otherReviews,
  sentinelRef,
}: Props) {
  const router = useRouter()

  const goReviewDetail = (reviewId: number) => {
    router.push(`/library/works/review/${reviewId}`)
  }
  const [revealedSpoilerIds, setRevealedSpoilerIds] = useState<Set<number>>(
    new Set(),
  )
  return (
    <section className="flex flex-col items-stretch w-full">
      <p className="heading-2 -mx-4 px-5 pt-5 pb-3 text-black">
        다른 유저들의 리뷰
      </p>

      {otherReviews.length === 0 ? (
        <p className="body-2 text-gray-400">아직 다른 유저 리뷰가 없어요</p>
      ) : (
        otherReviews.map((r) => {
          const isSpoiler = Boolean((r as any).isSpoiler)
          const isHidden = isSpoiler && !revealedSpoilerIds.has(r.reviewId)

          const onClick = () => {
            if (isHidden) {
              setRevealedSpoilerIds((prev) => {
                const next = new Set(prev)
                next.add(r.reviewId)
                return next
              })
              return
            }
            goReviewDetail(r.reviewId)
          }
          return (
            <div
              key={r.reviewId}
              className="text-left -mx-4 px-5 border-b border-gray-100"
            >
              <div className="flex items-center gap-2 mt-5">
                <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden flex items-center justify-center">
                  {r.profileImageUrl ? (
                    <Image
                      src={r.profileImageUrl}
                      alt={r.userName ?? 'profile'}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img src="/common/icons/reviewProfile.svg" alt={r.userName ?? "profile"} width="32" height="32" className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>

                <p className="body-2 text-gray-900 flex-1 min-w-0 w-full truncate">
                  {r.userName ?? '익명'}
                </p>
              </div>

              {/*   아래: content 블럭 */}
              <button
                className="flex w-full py-5 justify-between items-center text-left cursor-pointer "
                key={r.reviewId}
                type="button"
                onClick={onClick}
              >
                <div className="relative flex-1">
                  <p
                    className={[
                      'body-2 text-gray-700 whitespace-pre-wrap break-words line-clamp-3 pr-6',
                      isHidden ? 'blur-sm select-none' : '',
                    ].join(' ')}
                  >
                    {r.content ?? ''}
                  </p>
                  {isHidden && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="px-3 py-1.5 text-[var(--color-magenta-300)] caption-1">
                        스포일러가 포함된 리뷰입니다 · 탭해서 보기
                      </span>
                    </span>
                  )}
                </div>

                <ForwardArrowIcon />
              </button>
            </div>
          )
        })
      )}

      {/*   UI 변경 없음: 무한스크롤 sentinel */}
      <div ref={sentinelRef} />
    </section>
  )
}
