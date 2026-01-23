// src/components/common/report/ReportFlow.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type ReportFlowProps<T> = {
  isReportOpen: boolean
  reportTarget: T | null
  onCloseReport: () => void
  onConfirmReport: () => Promise<void>
  reportDoneOpen: boolean
  onCloseDone: () => void

  /** target에서 프로필 이미지/닉네임을 꺼내오기 위한 accessor */
  getProfileImage: (t: T) => string
  getNickname: (t: T) => string

  /** optional: 완료/토스트 하단 위치(기본 88) */
  doneBottom?: number

  // ✅ duplicated toast
  toastOpen?: boolean
  toastMessage?: string
  onCloseToast?: () => void
}

/**
 * 공통 신고 Flow UI
 * 1) 점3개 -> 신고하기 클릭 (외부에서 열어줌)
 * 2) 신고 모달(취소/신고하기)
 * 3) 신고 완료 팝업(report-done.svg)
 * 4) (추가) 중복 신고 토스트
 */
export default function ReportFlow<T>({
  isReportOpen,
  reportTarget,
  onCloseReport,
  onConfirmReport,
  reportDoneOpen,
  onCloseDone,
  getProfileImage,
  getNickname,
  doneBottom = 88,

  toastOpen = false,
  toastMessage = '',
  onCloseToast,
}: ReportFlowProps<T>) {
  // ✅ Portal mount (fixed가 특정 레이아웃에서 잘리는 이슈 방지)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const ui = (
    <>
      {/* ✅ 신고 모달 */}
      {isReportOpen && reportTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* 배경 */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50 cursor-pointer"
            onClick={onCloseReport}
            aria-label="모달 닫기"
          />

          {/* 모달 */}
          <div
            className="relative flex flex-col w-[306px] h-[209px] pt-7 pb-4 rounded-[12px] bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full px-6 text-center">
              <h2
                className="heading-2"
                style={{ color: 'var(--color-gray-900)' }}
              >
                신고하기
              </h2>
              <p
                className="body-2 mt-1"
                style={{ color: 'var(--color-gray-500)' }}
              >
                정말로 아래 유저를 신고하시겠습니까?
              </p>
            </div>

            <div className="mt-4 w-full flex justify-center">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-gray-200)]">
                  <Image
                    src={getProfileImage(reportTarget)}
                    alt="신고 대상 프로필"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="body-2 ml-2"
                  style={{ color: 'var(--color-gray-600)' }}
                >
                  {getNickname(reportTarget)}
                </p>
              </div>
            </div>

            <div className="mt-auto w-full px-6 flex gap-2">
              <button
                type="button"
                onClick={onCloseReport}
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
                onClick={onConfirmReport}
                className="flex-1 h-[49px] rounded-[8px] transition-opacity hover:opacity-90 cursor-pointer"
                style={{
                  background: 'var(--color-warning)',
                  color: 'var(--color-white)',
                }}
              >
                <span className="body-1">신고하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 신고 완료 팝업 */}
      {reportDoneOpen && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[120]"
          style={{ bottom: doneBottom }}
        >
          <div className="relative" style={{ width: 333, height: 56 }}>
            <Image
              src="/feed/report-done.svg"
              alt="신고 완료"
              width={333}
              height={56}
              priority
            />

            <button
              type="button"
              onClick={onCloseDone}
              className="absolute top-1/2 -translate-y-1/2 right-[24px] w-[20px] h-[20px] cursor-pointer transition-opacity hover:opacity-70"
              aria-label="신고 완료 팝업 닫기"
            />
          </div>
        </div>
      )}

      {/* ✅ 중복 신고 토스트 */}
      {toastOpen && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[130]"
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
            <span className="body-2">{toastMessage}</span>

            {onCloseToast && (
              <button
                type="button"
                onClick={onCloseToast}
                className="ml-auto w-[20px] h-[20px] cursor-pointer transition-opacity hover:opacity-70"
                aria-label="토스트 닫기"
                style={{ background: 'transparent' }}
              />
            )}
          </div>
        </div>
      )}
    </>
  )

  // ✅ mounted 전에는 document가 없어서 portal 못 씀
  if (!mounted) return null
  return createPortal(ui, document.body)
}
