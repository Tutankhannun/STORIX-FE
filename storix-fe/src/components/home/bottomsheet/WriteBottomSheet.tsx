// src/components/home/bottomsheet/WriteBottomSheet.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import CheckBox from '@/public/common/icons/CheckBox'
import type { PlusWorksSearchItem } from '@/lib/api/plus/plus.schema' //
import { usePlusWorksSearch } from '@/hooks/plus/usePlusWorksSearch' //

const STORAGE_KEY_FEED = 'storix:selectedWork:feed'

type StoredWork = { id: number; title: string; meta: string; thumb: string }

export default function WriteBottomSheet({
  onClose,
  onPick,
}: {
  onClose: () => void
  onPick: (work: StoredWork) => void
}) {
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

  const worksQuery = usePlusWorksSearch({ keyword: debouncedKeyword, size: 20 }) //

  const works: PlusWorksSearchItem[] =
    worksQuery.data?.pages.flatMap((p) => p.result.content) ?? [] //

  const saveSelectedWorkToSession = (w: PlusWorksSearchItem) => {
    const payload: StoredWork = {
      id: Number(w.worksId),
      title: w.worksName ?? '', //
      meta: `${w.artistName ?? ''} · ${w.worksType ?? ''}`.trim(), //
      thumb: w.thumbnailUrl ?? '',
    }
    sessionStorage.setItem(STORAGE_KEY_FEED, JSON.stringify(payload))
    return payload
  }

  const goWritePage = () => {
    if (!selected) return
    const picked = works.find((w) => Number(w.worksId) === selected)
    if (!picked) return

    const stored = saveSelectedWorkToSession(picked)
    onPick(stored)
    handleClose()
  }

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
                          alt={w.worksName ?? ''} //
                          className="object-cover"
                          width={87}
                          height={116}
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0 items-start pr-2">
                      <span className="heading-4 w-full truncate text-left">
                        {w.worksName ?? ''} {/* ✅ */}
                      </span>
                      <span className="caption-1 w-full truncate text-left text-gray-500">
                        {w.artistName ?? ''} {/* ✅ */}
                        <span className="text-gray-300">·</span>
                        {w.worksType ?? ''} {/* ✅ */}
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
              className="h-12 w-full mb-4 rounded-xl bg-black text-body-1 text-white transition-opacity hover:opacity-90 cursor-pointer"
            >
              선택 작품 피드 쓰기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
