// src/components/home/bottomsheet/ReviewWriteBottomSheet.tsx
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import CheckBox from '@/public/common/icons/CheckBox'
import { usePlusWorksSearch } from '@/hooks/plus/usePlusWorksSearch'
import { usePlusReviewDuplicateCheck } from '@/hooks/plus/usePlusReviewDuplicateCheck'
import type { PlusWorksSearchItem } from '@/lib/api/plus/plus.schema'

const STORAGE_KEY_REVIEW = 'storix:selectedWork:review'

type StoredWork = { id: number; title: string; meta: string; thumb: string }

export default function ReviewWriteBottomSheet({
  onClose,
}: {
  onClose: () => void
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)

  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300)
    return () => clearTimeout(t)
  }, [keyword])

  useEffect(() => {
    setSelected(null)
  }, [debouncedKeyword])

  // 바텀시트 열기/닫기
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true))
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 250)
  }

  // PLUS 작품 검색
  const worksQuery = usePlusWorksSearch({ keyword: debouncedKeyword, size: 20 })

  const works: PlusWorksSearchItem[] =
    worksQuery.data?.pages.flatMap((p) => p.result.content) ?? []

  // 선택 작품 리뷰 중복 조회
  const duplicateQuery = usePlusReviewDuplicateCheck(selected ?? undefined)

  const isDuplicated =
    duplicateQuery.data?.result?.isDuplicated === true ||
    (duplicateQuery.data?.isSuccess === false &&
      duplicateQuery.data?.code === 'PLUS_ERROR_004')

  const saveSelectedWorkToSession = (w: PlusWorksSearchItem) => {
    const payload: StoredWork = {
      id: Number(w.worksId),
      title: w.worksName ?? '',
      meta: `${w.artistName ?? ''} · ${w.worksType ?? ''}`.trim(),
      thumb: w.thumbnailUrl ?? '',
    }
    sessionStorage.setItem(STORAGE_KEY_REVIEW, JSON.stringify(payload))
  }

  const goWritePage = async () => {
    if (!selected) return

    // 이미 선택 시 조회가 끝났으면 캐시 값으로 판단 (refetch로 2번 쏘지 않음)
    let duplicated = isDuplicated

    if (!duplicateQuery.data && !duplicateQuery.isFetching) {
      const { data } = await duplicateQuery.refetch()
      const byFlag = data?.result?.isDuplicated === true
      const byErrorCode =
        data?.isSuccess === false && data?.code === 'PLUS_ERROR_004'
      duplicated = byFlag || byErrorCode
    }

    if (duplicated) return // 중복이면 막기

    const picked = works.find((w) => Number(w.worksId) === selected)
    if (!picked) return

    saveSelectedWorkToSession(picked)
    handleClose()
    router.push(`/feed/review/write/${selected}`)
  }

  const reviewButtonDisabled =
    !selected ||
    isDuplicated ||
    duplicateQuery.isFetching ||
    duplicateQuery.isError

  const reviewButtonLabel = duplicateQuery.isFetching
    ? '중복 확인 중...'
    : duplicateQuery.isError
      ? '중복 확인에 실패했어요'
      : isDuplicated
        ? '이미 리뷰를 작성했어요'
        : '선택 작품 리뷰 쓰기'

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex items-end justify-center',
        'transition-opacity duration-300',
        isOpen ? 'bg-black/40 opacity-100' : 'bg-black/0 opacity-0',
      ].join(' ')}
      onClick={handleClose}
    >
      <div
        className={[
          'w-full max-w-[393px] rounded-t-2xl bg-white px-4',
          'h-[80%]',
          'flex flex-col',
          'transform transition-transform duration-200 ease-out will-change-transform',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between py-7">
          <span className="heading-2">작품선택</span>
          <button onClick={handleClose} className="cursor-pointer">
            <img src="/common/icons/cancel.svg" alt="??" width="20" height="20" loading="lazy" />
          </button>
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            placeholder="함께 이야기하고 싶은 작품을 검색하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-body-2"
          />
          <img src="/common/icons/search.svg" alt="??" width="20" height="20" className="absolute right-4 top-1/2 -translate-y-1/2" loading="lazy" />
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto flex-1">
          {debouncedKeyword.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-body-2 text-gray-400">
              검색어를 입력하세요
            </div>
          ) : worksQuery.isFetching ? (
            <div className="flex flex-1 items-center justify-center text-body-2 text-gray-400">
              검색 중...
            </div>
          ) : worksQuery.isError ? (
            <div className="flex flex-1 items-center justify-center text-body-2 text-gray-400">
              검색에 실패했어요
            </div>
          ) : works.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-body-2 text-gray-400">
              검색 결과가 없습니다
            </div>
          ) : (
            works.map((w) => {
              const id = Number(w.worksId)
              const isSelected = selected === id
              return (
                <button
                  key={id}
                  onClick={() =>
                    setSelected((prev) => (prev === id ? null : id))
                  }
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex flex-1 min-w-0 items-center gap-3">
                    <div className="relative h-[116px] w-[87px] shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {w.thumbnailUrl ? (
                        <Image
                          src={w.thumbnailUrl}
                          alt={w.worksName ?? ''}
                          className="object-cover"
                          width={87}
                          height={116}
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0 items-start pr-2">
                      <span className="heading-4 w-full truncate text-left">
                        {w.worksName ?? ''}
                      </span>
                      <span className="caption-1 w-full truncate text-left text-gray-500">
                        {w.artistName ?? ''}
                        <span className="text-gray-300">·</span>
                        {w.worksType ?? ''}
                      </span>
                    </div>
                  </div>

                  <span
                    className={
                      isSelected
                        ? 'text-[var(--color-magenta-300)]'
                        : 'text-gray-300'
                    }
                  >
                    <CheckBox />
                  </span>
                </button>
              )
            })
          )}
        </div>

        {selected && (
          <div className="pt-4">
            <button
              onClick={goWritePage}
              disabled={reviewButtonDisabled}
              className={[
                'h-12 w-full mb-4 rounded-xl text-body-1 text-white transition-opacity',
                reviewButtonDisabled
                  ? 'bg-gray-300'
                  : 'bg-black cursor-pointer hover:opacity-90',
              ].join(' ')}
            >
              {reviewButtonLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
