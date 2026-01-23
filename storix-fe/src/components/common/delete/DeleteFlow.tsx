// src/components/common/delete/DeleteFlow.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type DeleteFlowProps<T> = {
  isDeleteOpen: boolean
  deleteTarget: T | null
  onCloseDelete: () => void
  onConfirmDelete: () => Promise<void>
  deleteDoneOpen: boolean
  onCloseDone: () => void

  getProfileImage: (t: T) => string
  getNickname: (t: T) => string

  doneBottom?: number
}

export default function DeleteFlow<T>({
  isDeleteOpen,
  deleteTarget,
  onCloseDelete,
  onConfirmDelete,
  deleteDoneOpen,
  onCloseDone,
  doneBottom = 88,
}: DeleteFlowProps<T>) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const ui = (
    <>
      {/* ✅ 삭제 모달 */}
      {isDeleteOpen && deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 cursor-pointer"
            onClick={onCloseDelete}
            aria-label="모달 닫기"
          />

          <div
            className="relative flex flex-col w-[306px] pt-7 pb-4 rounded-[12px] bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full px-6 text-center">
              <h2
                className="heading-2"
                style={{ color: 'var(--color-gray-900)' }}
              >
                삭제하기
              </h2>
              <p
                className="body-2 mt-1"
                style={{ color: 'var(--color-gray-500)' }}
              >
                정말로 삭제하시겠습니까?
              </p>
            </div>

            {/* ✅ 텍스트 ↔ 버튼 간격 28px */}
            <div className="w-full px-6 flex gap-2" style={{ marginTop: 28 }}>
              <button
                type="button"
                onClick={onCloseDelete}
                className="flex-1 h-[49px] rounded-[8px] transition-opacity hover:opacity-80 cursor-pointer"
                style={{
                  border: '1px solid var(--color-gray-200)',
                  background: 'var(--color-gray-50)',
                  color: 'var(--color-gray-700)',
                }}
              >
                <span className="body-1">취소</span>
              </button>

              <button
                type="button"
                onClick={onConfirmDelete}
                className="flex-1 h-[49px] rounded-[8px] transition-opacity hover:opacity-90 cursor-pointer"
                style={{
                  background: 'var(--color-warning)',
                  color: 'var(--color-white)',
                }}
              >
                <span className="body-1">삭제하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 삭제 완료 토스트 */}
      {deleteDoneOpen && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[120]"
          style={{ bottom: doneBottom }}
          role="status"
          aria-live="polite"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative flex items-center gap-2 px-4 h-[56px] rounded-[12px] shadow-md"
            style={{
              width: 333,
              backgroundColor: 'var(--color-gray-900)',
              color: 'var(--color-white)',
            }}
          >
            <span className="body-2">삭제가 완료되었어요.</span>

            <button
              type="button"
              onClick={onCloseDone}
              className="ml-auto w-[20px] h-[20px] cursor-pointer transition-opacity hover:opacity-70"
              aria-label="삭제 완료 토스트 닫기"
              style={{ background: 'transparent' }}
            />
          </div>
        </div>
      )}
    </>
  )

  if (!mounted) return null
  return createPortal(ui, document.body)
}
