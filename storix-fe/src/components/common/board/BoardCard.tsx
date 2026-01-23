// src/components/common/board/BoardCard.tsx
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useOpenMenu } from '@/hooks/useOpenMenu'
import { useReportFlow } from '@/hooks/useReportFlow'
import { useDeleteFlow } from '@/hooks/useDeleteFlow'
import ReportFlow from '@/components/common/report/ReportFlow'
import DeleteFlow from '@/components/common/delete/DeleteFlow'
import { useProfileStore } from '@/store/profile.store'
import type { ReportConfirmOutcome } from '@/hooks/useReportFlow'

const FALLBACK_PROFILE = '/profile/profile-default.svg'

export type BoardCardData = {
  boardId: number

  profile: {
    profileImageUrl: string | null
    nickName: string
    // userId?: number
  }

  board: {
    userId: number
    lastCreatedTime: string
    content: string
    likeCount: number
    replyCount: number
    isLiked: boolean
  }

  images?: { imageUrl: string; sortOrder: number }[]

  works?: null | {
    thumbnailUrl: string
    worksName: string
    artistName: string
    worksType: string
    genre: string
    hashtags: string[]
  }
}

type Props = {
  data: BoardCardData
  to?: string
  clickable?: boolean
  worksTo?: string

  onReportConfirm?: (args: {
    boardId: number
    reportedUserId: number
  }) => Promise<ReportConfirmOutcome> | ReportConfirmOutcome

  // ✅ 좋아요 토글(하트 클릭)
  onToggleLike?: (boardId: number) => void | Promise<void>

  onDeleteConfirm?: (args: { boardId: number }) => Promise<void> | void
}

export default function BoardCard({
  data,
  to,
  clickable = true,
  worksTo = '/feed',
  onReportConfirm,
  onDeleteConfirm,
  onToggleLike,
}: Props) {
  const router = useRouter()
  const { boardId } = data
  const link = to ?? `/feed/article/${boardId}`

  const meProfile = useProfileStore((s) => s.me)
  const myUserId = meProfile?.userId
  const isMine = myUserId != null && data.board.userId === myUserId

  const menu = useOpenMenu<number>()

  const report = useReportFlow<{
    boardId: number
    reportedUserId: number
    profileImage: string
    nickname: string
  }>({
    onConfirm: async (t) => {
      // ✅ 결과를 그대로 넘겨야 duplicated 토스트가 뜸
      return await onReportConfirm?.({
        boardId: t.boardId,
        reportedUserId: t.reportedUserId,
      })
    },
    doneDurationMs: 5000,
    toastDurationMs: 1500,
    duplicatedMessage: '이미 신고한 게시글입니다.',
  })

  const del = useDeleteFlow<{
    boardId: number
    profileImage: string
    nickname: string
  }>({
    onConfirm: async (t) => {
      await onDeleteConfirm?.({ boardId: t.boardId })
    },
    doneDurationMs: 5000,
  })

  useEffect(() => {
    console.log('[BoardCard] debug', {
      boardId,
      myUserId,
      boardUserId: data.board.userId,
      isMine,
      profileUserId: (data as any)?.profile?.userId,
      menuOpenId: menu.openId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, myUserId, isMine, menu.openId])

  const sortedImages =
    data.images
      ?.slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((x) => x.imageUrl) ?? []

  return (
    <>
      <div
        className={[
          'relative',
          'py-5',
          clickable ? 'cursor-pointer hover:opacity-95 transition-opacity' : '',
        ].join(' ')}
        style={{
          borderBottom: '1px solid var(--color-gray-100)',
          backgroundColor: 'var(--color-white)',
        }}
        onClick={() => {
          if (!clickable) return
          router.push(link)
        }}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={(e) => {
          if (!clickable) return
          if (e.key === 'Enter' || e.key === ' ') router.push(link)
        }}
      >
        <div
          className="px-4 flex items-center justify-between h-[41px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--color-gray-200)]">
              <Image
                src={data.profile.profileImageUrl ?? FALLBACK_PROFILE}
                alt="프로필"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col">
              <p
                className="text-[16px] font-medium leading-[140%]"
                style={{ color: 'var(--color-gray-900)' }}
              >
                {data.profile.nickName}
              </p>
              <p
                className="mt-[2px] text-[12px] font-medium leading-[140%]"
                style={{ color: 'var(--color-gray-300)' }}
              >
                {data.board.lastCreatedTime}
              </p>
            </div>
          </div>

          <div className="relative" ref={menu.bindRef(boardId)}>
            <button
              type="button"
              className="w-6 h-6 cursor-pointer transition-opacity hover:opacity-70"
              onClick={(e) => {
                e.stopPropagation()
                menu.toggle(boardId)
              }}
              aria-label="메뉴"
            >
              <Image
                src="/icons/menu-3dots.svg"
                alt="메뉴"
                width={24}
                height={24}
              />
            </button>

            {menu.openId === boardId && (
              <div
                className="absolute right-0 top-[30px] z-[999] bg-white rounded-[4px]"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="block w-[96px] h-[36px] rounded-[4px] overflow-hidden"
                  style={{ boxShadow: '0 0 8px rgba(0,0,0,0.25)' }}
                  onClick={(e) => {
                    e.stopPropagation()

                    const profileImage =
                      data.profile.profileImageUrl ?? FALLBACK_PROFILE
                    const nickname = data.profile.nickName

                    if (isMine) {
                      del.openDeleteModal({ boardId, profileImage, nickname })
                    } else {
                      report.openReportModal({
                        boardId,
                        reportedUserId: data.board.userId,
                        profileImage,
                        nickname,
                      })
                    }

                    requestAnimationFrame(() => menu.close())
                  }}
                  aria-label={isMine ? '삭제하기' : '신고하기'}
                >
                  <img
                    src={
                      isMine
                        ? '/icons/delete-dropdown.svg'
                        : '/icons/comment-dropdown.svg'
                    }
                    alt={isMine ? '삭제하기' : '신고하기'}
                    width={96}
                    height={36}
                    className="block w-[96px] h-[36px] object-contain bg-white"
                    draggable={false}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {sortedImages.length > 0 && (
          <div className="mt-4 px-4">
            <div className="overflow-x-auto">
              <div className="flex gap-3">
                {sortedImages.slice(0, 3).map((src, idx) => (
                  <div
                    key={`${boardId}-img-${idx}`}
                    className="w-[236px] h-[236px] rounded-[12px] overflow-hidden flex-shrink-0"
                    style={{
                      border: '1px solid var(--color-gray-100)',
                      background: 'lightgray',
                    }}
                  >
                    <Image
                      src={src}
                      alt={`피드 이미지 ${idx + 1}`}
                      width={236}
                      height={236}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {data.works && (
          <div className="mt-5 px-4" onClick={(e) => e.stopPropagation()}>
            <div
              className="p-3 rounded-xl flex gap-3"
              style={{
                border: '1px solid var(--color-gray-100)',
                backgroundColor: 'var(--color-white)',
              }}
            >
              <div className="w-[62px] h-[83px] rounded bg-[var(--color-gray-200)] flex-shrink-0 overflow-hidden relative">
                <Image
                  src={data.works.thumbnailUrl}
                  alt="표지"
                  fill
                  sizes="62px"
                  className="object-cover"
                />
              </div>

              <div className="flex w-full items-stretch">
                <div className="flex flex-col justify-between w-[210px]">
                  <p
                    className="text-[16px] font-medium leading-[140%] overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ color: 'var(--color-black)' }}
                  >
                    {data.works.worksName}
                  </p>

                  <p
                    className="text-[12px] font-medium leading-[140%]"
                    style={{ color: 'var(--color-gray-500)' }}
                  >
                    {data.works.artistName} · {data.works.worksType} ·{' '}
                    {data.works.genre}
                  </p>

                  <div className="flex gap-1 flex-wrap">
                    {data.works.hashtags.map((tag, index) => (
                      <div
                        key={index}
                        className="px-2 py-[6px] rounded text-[10px] font-medium leading-[140%] tracking-[0.2px]"
                        style={{
                          border: '1px solid var(--color-gray-100)',
                          backgroundColor: 'var(--color-gray-50)',
                          color: 'var(--color-gray-800)',
                        }}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(worksTo)
                  }}
                  className="ml-auto pl-3 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70"
                  aria-label="작품 상세 보기"
                >
                  <Image
                    src="/icons/icon-arrow-forward-small.svg"
                    alt="작품 상세"
                    width={24}
                    height={24}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 px-4">
          <p
            className="text-[14px] font-medium leading-[140%] line-clamp-3"
            style={{ color: 'var(--color-gray-800)' }}
          >
            {data.board.content}
          </p>
        </div>

        <div
          className="mt-5 px-4 flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center cursor-pointer transition-opacity hover:opacity-80"
              aria-label="좋아요"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation() // ✅ 카드 클릭(상세 이동) 방지
                onToggleLike?.(boardId) // ✅ 외부 핸들러 호출
              }}
            >
              <Image
                src={
                  data.board.isLiked
                    ? '/icons/icon-like-pink.svg'
                    : '/icons/icon-like.svg'
                }
                alt="좋아요"
                width={24}
                height={24}
              />
            </button>

            {data.board.likeCount > 0 && (
              <span
                className="ml-1 text-[14px] font-bold leading-[140%]"
                style={{ color: 'var(--color-gray-500)' }}
              >
                {data.board.likeCount}
              </span>
            )}
          </div>

          <div className="flex items-center ml-4">
            <Image
              src="/icons/icon-comment.svg"
              alt="댓글"
              width={24}
              height={24}
            />
            {data.board.replyCount > 0 && (
              <span
                className="ml-1 text-[14px] font-bold leading-[140%]"
                style={{ color: 'var(--color-gray-500)' }}
              >
                {data.board.replyCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <ReportFlow<{
        boardId: number
        reportedUserId: number
        profileImage: string
        nickname: string
      }>
        isReportOpen={report.isReportOpen}
        reportTarget={report.reportTarget}
        onCloseReport={report.closeReportModal}
        onConfirmReport={report.handleReportConfirm}
        reportDoneOpen={report.reportDoneOpen}
        onCloseDone={report.closeReportDone}
        getProfileImage={(t) => t.profileImage}
        getNickname={(t) => t.nickname}
        toastOpen={report.toastOpen}
        toastMessage={report.toastMessage}
        onCloseToast={report.closeToast}
      />

      <DeleteFlow<{
        boardId: number
        profileImage: string
        nickname: string
      }>
        isDeleteOpen={del.isDeleteOpen}
        deleteTarget={del.deleteTarget}
        onCloseDelete={del.closeDeleteModal}
        onConfirmDelete={del.handleDeleteConfirm}
        deleteDoneOpen={del.deleteDoneOpen}
        onCloseDone={del.closeDeleteDone}
        getProfileImage={(t) => t.profileImage}
        getNickname={(t) => t.nickname}
      />
    </>
  )
}
