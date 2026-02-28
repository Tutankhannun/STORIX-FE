//src/components/library/works/WorkTapContent.tsx
'use client'

import Image from 'next/image'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ForwardArrowIcon from '@/public/icons/layout/FowardArrowIcon'
import OtherReviewsSection from '@/components/library/works/OtherReviewsSection'

import {
  useWorksMyReview,
  useWorksReviewsInfinite,
} from '@/hooks/works/useWorksReviews'

type TabKey = 'info' | 'review'

type UIData = {
  reviewCount: number
  title: string
  description: string
  keywords: string[]
  platform: string
}

const getPlatformIconSrc = (platform: string) => {
  const p = platform.trim()

  if (p.includes('네이버 웹툰')) return '/icons/platform/naverWebtoon.png'
  if (p.includes('리디북스')) return '/icons/platform/ridibooks.png'
  if (p.includes('카카오웹툰')) return '/icons/platform/kakaoWebtoon.png'
  if (p.includes('카카오페이지')) return '/icons/platform/kakaoPage.png'

  return null
}

type Props = {
  worksId: number
  tab: TabKey
  onChangeTab: (tab: TabKey) => void
  ui: UIData
  isCheckingRoom: boolean
  onReviewWrite: () => void
  onTopicroomEnter: () => void
}

export default function WorkTabContent({
  worksId,
  tab,
  onChangeTab,
  ui,
  isCheckingRoom,
  onReviewWrite,
  onTopicroomEnter,
}: Props) {
  const router = useRouter()
  const { data: myReview } = useWorksMyReview(worksId)
  const {
    data: reviewPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWorksReviewsInfinite(worksId)

  const otherReviews = reviewPages?.pages.flatMap((p) => p.content ?? []) ?? []

  const { ref, inView } = useInView({
    threshold: 0,
  })

  // 무한스크롤 트리거
  useEffect(() => {
    if (!inView) return
    if (!hasNextPage) return
    if (isFetchingNextPage) return
    fetchNextPage()
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const platformIconSrc = ui.platform ? getPlatformIconSrc(ui.platform) : null

  const goReviewDetail = (reviewId: number) => {
    router.push(`/library/works/review/${reviewId}`)
  }

  return (
    <>
      {/* Tabs */}
      <div className="px-4">
        <div className="flex border-b border-gray-200 -mx-4">
          <button
            type="button"
            onClick={() => onChangeTab('info')}
            className={[
              'flex-1 py-3 text-center body-1 cursor-pointer',
              tab === 'info' ? 'text-black' : 'text-gray-400',
            ].join(' ')}
          >
            정보
          </button>
          <button
            type="button"
            onClick={() => onChangeTab('review')}
            className={[
              'flex-1 py-3 text-center body-1 cursor-pointer',
              tab === 'review' ? 'text-black' : 'text-gray-400',
            ].join(' ')}
          >
            리뷰({ui.reviewCount})
          </button>
        </div>

        <div className="relative -mx-4 px-4">
          <div
            className={[
              'absolute -top-[1px] h-[2px] w-1/2 bg-black transition-transform duration-200 -mx-4 px-4',
              tab === 'info' ? 'translate-x-0' : 'translate-x-full',
            ].join(' ')}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+88px)]">
        {tab === 'info' ? (
          <div>
            <section className="pt-6">
              <p className="heading-2 text-black">감상 가능한 곳</p>

              {ui.platform.length === 0 ? (
                <p className="body-2 mt-3 text-gray-400">
                  플랫폼 정보가 없어요
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  <div key={ui.platform} className="flex items-center gap-3">
                    {/*   UI 변경: R 제거 -> 35px 원형 플랫폼 아이콘 */}
                    <div className="relative h-[35px] w-[35px] overflow-hidden rounded-full bg-gray-100">
                      {platformIconSrc ? (
                        <Image
                          src={platformIconSrc}
                          alt={ui.platform}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="body-2 text-gray-700">{ui.platform}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="pt-8">
              <p className="heading-2 text-black">작품 소개</p>
              <p className="body-2 mt-3 whitespace-pre-line text-gray-600 line-clamp-6">
                {ui.description || '작품 소개가 없어요'}
              </p>
            </section>

            <section className="pt-8">
              <p className="heading-2 text-black">키워드</p>
              {ui.keywords.length === 0 ? (
                <p className="body-2 mt-3 text-gray-400">키워드가 없어요</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2 ">
                  {ui.keywords.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm cursor-pointer"
                    >
                      #{k}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div>
            <section className="-mx-4 px-5 bg-gray-50 border-b border-gray-100">
              <p className="heading-2 text-black px-1 pt-5 pb-3">내 리뷰</p>

              <button
                type="button"
                onClick={() => {
                  // 내 리뷰가 있으면 상세로, 없으면 작성으로
                  if (myReview?.content && myReview.reviewId) {
                    goReviewDetail(myReview.reviewId)
                    return
                  }
                  onReviewWrite()
                }}
                className="w-full py-5 px-1 text-left cursor-pointer "
              >
                {myReview?.content ? (
                  <p className="inline-flex w-full body-2 mt-1 text-gray-500 line-clamp-2 justify-between">
                    {myReview.content}
                    <ForwardArrowIcon />
                  </p>
                ) : (
                  <p className="body-2 mt-1 text-gray-700 line-clamp-2">
                    아직 작성한 리뷰가 없어요. 리뷰를 작성해보세요!
                  </p>
                )}
              </button>
            </section>

            <OtherReviewsSection
              otherReviews={otherReviews}
              sentinelRef={ref}
            />
          </div>
        )}
      </div>
      <div className="flex w-[393px] fixed bottom-0 z-50 bg-white pt-3 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="flex gap-3 w-full max-w-[393px]">
          <button
            type="button"
            // onClick={onReviewWrite}
            className="flex py-1.5 px-1.5 items-center justify-center gap-1 rounded-xl bg-[var(--color-magenta-50)] cursor-pointer"
          >
            <img src="/icons/icon-share.svg" alt="share" width="32" height="32" className="inline-block" loading="lazy" />
          </button>

          <button
            type="button"
            onClick={onTopicroomEnter}
            disabled={isCheckingRoom}
            className="flex flex-1 items-center justify-center rounded-xl bg-[var(--color-magenta-300)] text-white body-2 disabled:opacity-50 cursor-pointer"
          >
            <img src="/common/icons/fire.svg" alt="fire" width="24" height="24" className="inline-block mb-0.5" loading="lazy" />
            {isCheckingRoom ? '확인 중...' : '토픽룸 입장'}
          </button>
        </div>
      </div>
    </>
  )
}
