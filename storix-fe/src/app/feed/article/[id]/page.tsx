// /src/app/feed/article/[id]/page.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'

import PostCard from '@/components/common/post/PostCard'
import ReportFlow from '@/components/common/report/ReportFlow'
import DeleteFlow from '@/components/common/delete/DeleteFlow'

import { useOpenMenu } from '@/hooks/useOpenMenu'
import { useReportFlow } from '@/hooks/useReportFlow'
import { useDeleteFlow } from '@/hooks/useDeleteFlow'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

import {
  getBoardDetail,
  createReply,
  toggleReplyLike,
  type ReplyItem,
} from '@/api/feed/readerBoardDetail.api'
import { toggleBoardLike, reportBoard } from '@/api/feed/readerBoard.api'
import { apiClient } from '@/api/axios-instance'
import { useProfileStore } from '@/store/profile.store'

type ReportTargetBoard = {
  boardId: number
  reportedUserId: number
  profileImage: string
  nickname: string
}

type ReportTargetReply = {
  boardId: number
  replyId: number
  reportedUserId: number
  profileImage: string
  nickname: string
}

type DeleteTargetBoard = {
  boardId: number
  profileImage: string
  nickname: string
}

type DeleteTargetReply = {
  boardId: number
  replyId: number
  profileImage: string
  nickname: string
}

const FALLBACK_PROFILE = '/profile/profile-default.svg'

// ✅ 내 글 삭제 API (명세: DELETE /api/v1/feed/reader/board/{boardId})
const deleteBoard = async (boardId: number) => {
  const res = await apiClient.delete(`/api/v1/feed/reader/board/${boardId}`)
  return res.data
}

// ✅ 내 댓글 삭제 API (명세: DELETE /api/v1/feed/reader/board/{boardId}/reply/{replyId})
const deleteReply = async (boardId: number, replyId: number) => {
  const res = await apiClient.delete(
    `/api/v1/feed/reader/board/${boardId}/reply/${replyId}`,
  )
  return res.data
}

/**
 * ✅ "이미 신고"를 duplicated outcome으로 매핑하기 위한 판별기
 */
const isDuplicatedReportError = (err: unknown) => {
  if (!axios.isAxiosError(err)) return false

  const status = err.response?.status
  const data: any = err.response?.data

  if (status !== 400 && status !== 409) return false

  const msg = String(
    data?.message ?? data?.result?.message ?? data?.error?.message ?? '',
  )

  const code = String(
    data?.code ?? data?.result?.code ?? data?.errorCode ?? '',
  ).toUpperCase()

  return (
    (msg.includes('이미') && msg.includes('신고')) ||
    code.includes('ALREADY') ||
    code.includes('DUPLICATE')
  )
}

// ✅ 남 댓글 신고 API
const reportReply = async (args: {
  boardId: number
  replyId: number
  reportedUserId: number
}) => {
  const { boardId, replyId, reportedUserId } = args

  const body =
    typeof reportedUserId === 'number' && Number.isFinite(reportedUserId)
      ? { reportedUserId }
      : undefined

  const res = await apiClient.post(
    `/api/v1/feed/reader/board/${boardId}/reply/${replyId}/report`,
    body,
  )
  return res.data
}

export default function FeedArticlePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const boardId = Number(params?.id)

  // ✅ 내 userId
  const me = useProfileStore((s) => s.me)
  const myUserId = me?.userId

  // ✅ 무한스크롤 root/sentinel
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const handleBack = () => router.back()

  // ✅ 하단 댓글 입력창(68px) 위로 토스트/완료 올리기
  // - 68 + 16 = 84 (조금 더 여유 주고 싶으면 96도 OK)
  const TOAST_BOTTOM = 84

  // ----------------------------
  // ✅ 상세 데이터
  // ----------------------------
  const [post, setPost] = useState<null | {
    profileImage: string
    nickname: string
    createdAt: string
    content: string
    images: string[]
    works: null | {
      thumbnailUrl: string
      worksName: string
      artistName: string
      worksType: string
      genre: string
      hashtags: string[]
    }
    like: { isLiked: boolean; likeCount: number }
    replyCount: number
    writerUserId: number
    isSpoiler: boolean
  }>(null)

  const [loading, setLoading] = useState(false)

  // ----------------------------
  // ✅ 댓글 페이징(무한)
  // ----------------------------
  const [replies, setReplies] = useState<ReplyItem[]>([])
  const [replyPage, setReplyPage] = useState(0)
  const [replyLast, setReplyLast] = useState(false)
  const [replyLoading, setReplyLoading] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!boardId || Number.isNaN(boardId)) return
    setLoading(true)
    try {
      const res = await getBoardDetail({ boardId, page: 0, sort: 'LATEST' })

      const b = res.board
      setPost({
        profileImage: b.profile.profileImageUrl ?? FALLBACK_PROFILE,
        nickname: b.profile.nickName,
        createdAt: b.board.lastCreatedTime,
        content: b.board.content,
        images: (b.images ?? [])
          .slice()
          .sort((a, c) => a.sortOrder - c.sortOrder)
          .map((x) => x.imageUrl),
        works: b.works
          ? {
              thumbnailUrl: b.works.thumbnailUrl,
              worksName: b.works.worksName,
              artistName: b.works.artistName,
              worksType: b.works.worksType,
              genre: b.works.genre,
              hashtags: b.works.hashtags ?? [],
            }
          : null,
        like: { isLiked: b.board.isLiked, likeCount: b.board.likeCount },
        replyCount: b.board.replyCount,
        isSpoiler: b.board.isSpoiler === true,
        writerUserId: b.board.userId,
      })

      setReplies(res.comment.content ?? [])
      setReplyPage(0)
      setReplyLast(Boolean(res.comment.last))
    } finally {
      setLoading(false)
    }
  }, [boardId])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const loadMoreReplies = useCallback(async () => {
    if (replyLoading || replyLast) return
    const next = replyPage + 1
    setReplyLoading(true)
    try {
      const res = await getBoardDetail({ boardId, page: next, sort: 'LATEST' })
      setReplies((prev) => [...prev, ...(res.comment.content ?? [])])
      setReplyPage(next)
      setReplyLast(Boolean(res.comment.last))
    } finally {
      setReplyLoading(false)
    }
  }, [boardId, replyLoading, replyLast, replyPage])

  useInfiniteScroll({
    root: scrollRef,
    target: sentinelRef,
    hasNextPage: !replyLast,
    isLoading: replyLoading,
    onLoadMore: loadMoreReplies,
    rootMargin: '200px',
  })

  // ----------------------------
  // ✅ 케밥 메뉴(게시글/댓글)
  // ----------------------------
  const postMenu = useOpenMenu<number>() // boardId
  const replyMenu = useOpenMenu<number>() // replyId

  // ----------------------------
  // ✅ 게시글 좋아요
  // ----------------------------
  const togglePostLike = async () => {
    if (!post) return

    // optimistic
    setPost((prev) => {
      if (!prev) return prev
      const nextLiked = !prev.like.isLiked
      return {
        ...prev,
        like: {
          isLiked: nextLiked,
          likeCount: Math.max(0, prev.like.likeCount + (nextLiked ? 1 : -1)),
        },
      }
    })

    try {
      const res = await toggleBoardLike(boardId)
      setPost((prev) => (prev ? { ...prev, like: res } : prev))
    } catch {
      loadDetail()
    }
  }

  // ----------------------------
  // ✅ 댓글 좋아요
  // ----------------------------
  const onToggleReplyLike = async (replyId: number) => {
    // optimistic
    setReplies((prev) =>
      prev.map((r) =>
        r.reply.replyId === replyId
          ? {
              ...r,
              reply: {
                ...r.reply,
                isLiked: !r.reply.isLiked,
                likeCount: Math.max(
                  0,
                  r.reply.likeCount + (!r.reply.isLiked ? 1 : -1),
                ),
              },
            }
          : r,
      ),
    )

    try {
      const res = await toggleReplyLike({ boardId, replyId })
      setReplies((prev) =>
        prev.map((r) =>
          r.reply.replyId === replyId
            ? {
                ...r,
                reply: {
                  ...r.reply,
                  isLiked: res.isLiked,
                  likeCount: res.likeCount,
                },
              }
            : r,
        ),
      )
    } catch {
      loadDetail()
    }
  }

  // ----------------------------
  // ✅ 댓글 작성
  // ----------------------------
  const [commentText, setCommentText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    const lineHeight = 19.6
    const maxHeight = lineHeight * 2
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    adjustTextarea()
  }, [commentText, adjustTextarea])

  const canSubmit = commentText.trim().length > 0

  const submitComment = async () => {
    const trimmed = commentText.trim()
    if (!trimmed) return

    const res = await createReply({ boardId, comment: trimmed })

    const newReply: ReplyItem = {
      profile: {
        userId: res.profile.userId,
        profileImageUrl: res.profile.profileImageUrl,
        nickName: res.profile.nickName,
      },
      reply: {
        replyId: res.content.replyId,
        userId: res.profile.userId,
        comment: res.content.content,
        lastCreatedTime: '방금 전',
        likeCount: res.content.likeCount,
        isLiked: false,
      },
    }

    setReplies((prev) => [newReply, ...prev])
    setPost((prev) =>
      prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev,
    )
    setCommentText('')
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  // ----------------------------
  // ✅ 신고 flow (게시글/댓글)
  // ----------------------------
  const reportBoardFlow = useReportFlow<ReportTargetBoard>({
    onConfirm: async (t) => {
      const out = await reportBoard({
        boardId: t.boardId,
        reportedUserId: t.reportedUserId,
      })

      // ✅ 핵심: reportBoard가 duplicated를 "반환"하므로 그대로 리턴
      if (out.status === 'duplicated') {
        return {
          status: 'duplicated' as const,
          message: out.message || '이미 신고한 게시글입니다.',
        }
      }

      return { status: 'ok' as const }
    },
    doneDurationMs: 1500,
    duplicatedMessage: '이미 신고한 게시글입니다.',
    toastDurationMs: 1500,
  })

  const reportReplyFlow = useReportFlow<ReportTargetReply>({
    onConfirm: async (t) => {
      try {
        const data = await reportReply({
          boardId: t.boardId,
          replyId: t.replyId,
          reportedUserId: t.reportedUserId,
        })

        // ✅ 백엔드가 200 + isSuccess:false로 중복을 줄 수도 있어서 방어
        if (data?.isSuccess === false) {
          const msg = String(data?.message ?? '')
          if (msg.includes('이미') && msg.includes('신고')) {
            return {
              status: 'duplicated' as const,
              message: '이미 신고한 댓글입니다.',
            }
          }
          throw new Error(msg || '신고에 실패했어요.')
        }

        return { status: 'ok' as const }
      } catch (err) {
        if (isDuplicatedReportError(err)) {
          return {
            status: 'duplicated' as const,
            message: '이미 신고한 댓글입니다.',
          }
        }
        throw err
      }
    },
    doneDurationMs: 1500,
    duplicatedMessage: '이미 신고한 댓글입니다.',
    toastDurationMs: 1500,
  })

  // ----------------------------
  // ✅ 삭제 flow (게시글/댓글)
  // ----------------------------
  const deleteBoardFlow = useDeleteFlow<DeleteTargetBoard>({
    onConfirm: async (t) => {
      const data = await deleteBoard(t.boardId)
      if (data?.isSuccess === false) {
        throw new Error(data?.message ?? '삭제에 실패했어요.')
      }
      router.replace('/feed')
    },
    doneDurationMs: 1500,
  })

  const deleteReplyFlow = useDeleteFlow<DeleteTargetReply>({
    onConfirm: async (t) => {
      const data = await deleteReply(t.boardId, t.replyId)
      if (data?.isSuccess === false) {
        throw new Error(data?.message ?? '삭제에 실패했어요.')
      }
      setReplies((prev) => prev.filter((x) => x.reply.replyId !== t.replyId))
      setPost((prev) =>
        prev ? { ...prev, replyCount: Math.max(0, prev.replyCount - 1) } : prev,
      )
      replyMenu.close()
    },
    doneDurationMs: 1500,
  })

  // ----------------------------
  // Topbar
  // ----------------------------
  const Topbar = () => (
    <div className="w-full h-14 p-4 flex justify-between items-center bg-white">
      <img
        src="/icons/back.svg"
        alt="뒤로가기"
        width={24}
        height={24}
        className="cursor-pointer brightness-0"
        onClick={handleBack}
      />
      <div className="flex-1 text-center">
        <span className="body-1" style={{ color: 'var(--color-gray-900)' }}>
          피드
        </span>
      </div>
      <div className="w-6" />
    </div>
  )

  if (!boardId || Number.isNaN(boardId)) {
    return (
      <div className="relative w-full min-h-full bg-white">
        <Topbar />
        <div
          className="px-4 py-10 body-2"
          style={{ color: 'var(--color-gray-500)' }}
        >
          존재하지 않는 글이에요.
        </div>
      </div>
    )
  }

  if (loading || !post) {
    return (
      <div className="relative w-full min-h-full bg-white">
        <Topbar />
        <div
          className="px-4 py-10 body-2"
          style={{ color: 'var(--color-gray-400)' }}
        >
          불러오는 중...
        </div>
      </div>
    )
  }

  const showCommentHeader = post.replyCount > 0
  const showCommentList = post.replyCount > 0 && replies.length > 0

  return (
    <>
      <div
        ref={scrollRef}
        className="relative w-full min-h-full bg-white overflow-y-auto"
        style={{ paddingBottom: 68 }}
      >
        <Topbar />

        <section className="bg-white">
          <PostCard
            variant="detail"
            boardId={boardId}
            writerUserId={post.writerUserId}
            profileImageUrl={post.profileImage}
            nickName={post.nickname}
            createdAt={post.createdAt}
            content={post.content}
            images={post.images}
            works={post.works}
            isSpoiler={post.isSpoiler}
            isLiked={post.like.isLiked}
            likeCount={post.like.likeCount}
            replyCount={post.replyCount}
            onToggleLike={togglePostLike}
            onOpenReport={() => {
              reportBoardFlow.openReportModal({
                boardId,
                reportedUserId: post.writerUserId,
                profileImage: post.profileImage,
                nickname: post.nickname,
              })
              postMenu.close()
            }}
            onOpenDelete={() => {
              deleteBoardFlow.openDeleteModal({
                boardId,
                profileImage: post.profileImage,
                nickname: post.nickname,
              })
              postMenu.close()
            }}
            isMenuOpen={postMenu.openId === boardId}
            onToggleMenu={() => postMenu.toggle(boardId)}
            menuRef={postMenu.bindRef(boardId)}
            onClickWorksArrow={() => router.push('/feed')}
          />
        </section>

        {/* 댓글 헤더 */}
        {showCommentHeader && (
          <div
            className="px-4 py-3"
            style={{ background: 'var(--white, #FFF)' }}
          >
            <p style={{ color: 'var(--color-gray-900)' }} className="body-2">
              댓글 {post.replyCount}
            </p>
          </div>
        )}

        {/* 댓글 리스트 */}
        {showCommentList &&
          replies.map((r) => (
            <ReplyCard
              key={r.reply.replyId}
              boardId={boardId}
              myUserId={myUserId ?? null}
              item={r}
              isMenuOpen={replyMenu.openId === r.reply.replyId}
              onToggleMenu={() => replyMenu.toggle(r.reply.replyId)}
              menuRef={replyMenu.bindRef(r.reply.replyId)}
              onClickDetail={() => router.push(`/feed/article/${boardId}`)}
              onToggleLike={() => onToggleReplyLike(r.reply.replyId)}
              onOpenDelete={() => {
                deleteReplyFlow.openDeleteModal({
                  boardId,
                  replyId: r.reply.replyId,
                  profileImage: r.profile.profileImageUrl ?? FALLBACK_PROFILE,
                  nickname: r.profile.nickName,
                })
                replyMenu.close()
              }}
              onOpenReport={() => {
                reportReplyFlow.openReportModal({
                  boardId,
                  replyId: r.reply.replyId,
                  reportedUserId: r.reply.userId,
                  profileImage: r.profile.profileImageUrl ?? FALLBACK_PROFILE,
                  nickname: r.profile.nickName,
                })
                replyMenu.close()
              }}
            />
          ))}

        <div ref={sentinelRef} style={{ height: 1 }} />
        {replyLoading && (
          <div
            className="px-4 py-4 body-2"
            style={{ color: 'var(--color-gray-400)' }}
          >
            댓글 불러오는 중...
          </div>
        )}

        {/* 댓글 입력창 */}
        <div
          className="fixed left-1/2 -translate-x-1/2 bg-white z-50"
          style={{ bottom: 0, width: 393, height: 68 }}
        >
          <div className="w-full h-full p-4 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--color-gray-200)] flex-shrink-0">
              <Image
                src={me?.profileImageUrl ?? FALLBACK_PROFILE}
                alt="내 프로필"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>

            <div
              className="flex w-[274px] px-4 py-2 gap-2.5 rounded-[30px] border bg-[var(--color-gray-50)] cursor-text"
              style={{ borderColor: 'var(--color-gray-200)' }}
              onClick={() => textareaRef.current?.focus()}
            >
              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={1}
                placeholder="댓글을 입력하세요"
                className="w-full bg-transparent outline-none resize-none body-2"
                style={{
                  color:
                    commentText.length > 0
                      ? 'var(--color-gray-800)'
                      : 'var(--color-gray-300)',
                  caretColor: 'var(--color-gray-800)',
                  height: 'auto',
                  overflowY: 'hidden',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (canSubmit) submitComment()
                  }
                }}
              />
              <style jsx>{`
                textarea::placeholder {
                  color: var(--color-gray-300);
                  opacity: 1;
                }
              `}</style>
            </div>

            <button
              type="button"
              onClick={submitComment}
              className="transition-opacity hover:opacity-70 cursor-pointer"
              aria-label="댓글 등록"
              disabled={!canSubmit}
              style={{ opacity: canSubmit ? 1 : 0.4, flexShrink: 0 }}
            >
              <Image
                src={
                  canSubmit
                    ? '/feed/comment-black.svg'
                    : '/feed/upload-comment.svg'
                }
                alt="댓글 등록"
                width={36}
                height={36}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ 게시글 신고 */}
      <ReportFlow<ReportTargetBoard>
        isReportOpen={reportBoardFlow.isReportOpen}
        reportTarget={reportBoardFlow.reportTarget}
        onCloseReport={reportBoardFlow.closeReportModal}
        onConfirmReport={reportBoardFlow.handleReportConfirm}
        reportDoneOpen={reportBoardFlow.reportDoneOpen}
        onCloseDone={reportBoardFlow.closeReportDone}
        getProfileImage={(t) => t.profileImage}
        getNickname={(t) => t.nickname}
        toastOpen={reportBoardFlow.toastOpen}
        toastMessage={reportBoardFlow.toastMessage}
        onCloseToast={reportBoardFlow.closeToast}
        doneBottom={TOAST_BOTTOM}
      />

      {/* ✅ 댓글 신고 */}
      <ReportFlow<ReportTargetReply>
        isReportOpen={reportReplyFlow.isReportOpen}
        reportTarget={reportReplyFlow.reportTarget}
        onCloseReport={reportReplyFlow.closeReportModal}
        onConfirmReport={reportReplyFlow.handleReportConfirm}
        reportDoneOpen={reportReplyFlow.reportDoneOpen}
        onCloseDone={reportReplyFlow.closeReportDone}
        getProfileImage={(t) => t.profileImage}
        getNickname={(t) => t.nickname}
        toastOpen={reportReplyFlow.toastOpen}
        toastMessage={reportReplyFlow.toastMessage}
        onCloseToast={reportReplyFlow.closeToast}
        doneBottom={TOAST_BOTTOM}
      />

      {/* ✅ 게시글 삭제 */}
      <DeleteFlow<DeleteTargetBoard>
        isDeleteOpen={deleteBoardFlow.isDeleteOpen}
        deleteTarget={deleteBoardFlow.deleteTarget}
        onCloseDelete={deleteBoardFlow.closeDeleteModal}
        onConfirmDelete={deleteBoardFlow.confirmDelete}
        deleteDoneOpen={deleteBoardFlow.deleteDoneOpen}
        onCloseDone={deleteBoardFlow.closeDeleteDone}
        getProfileImage={(t) => t.profileImage}
        getNickname={(t) => t.nickname}
        doneBottom={TOAST_BOTTOM}
      />

      {/* ✅ 댓글 삭제 */}
      <DeleteFlow<DeleteTargetReply>
        isDeleteOpen={deleteReplyFlow.isDeleteOpen}
        deleteTarget={deleteReplyFlow.deleteTarget}
        onCloseDelete={deleteReplyFlow.closeDeleteModal}
        onConfirmDelete={deleteReplyFlow.confirmDelete}
        deleteDoneOpen={deleteReplyFlow.deleteDoneOpen}
        onCloseDone={deleteReplyFlow.closeDeleteDone}
        getProfileImage={(t) => t.profileImage}
        getNickname={(t) => t.nickname}
        doneBottom={TOAST_BOTTOM}
      />
    </>
  )
}

function ReplyCard(props: {
  boardId: number
  myUserId: number | null
  item: ReplyItem
  isMenuOpen: boolean
  onToggleMenu: () => void
  menuRef: (el: HTMLDivElement | null) => void
  onClickDetail: () => void
  onToggleLike: () => void
  onOpenDelete: () => void
  onOpenReport: () => void
}) {
  const {
    myUserId,
    item,
    isMenuOpen,
    onToggleMenu,
    menuRef,
    onToggleLike,
    onOpenDelete,
    onOpenReport,
  } = props

  const profileImage = item.profile.profileImageUrl ?? FALLBACK_PROFILE
  const isMine = myUserId != null && item.reply.userId === myUserId

  return (
    <article
      className="px-4 py-3 flex flex-col gap-3 bg-white"
      style={{ borderBottom: '1px solid var(--color-gray-100)' }}
    >
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-gray-200)] flex-shrink-0">
            <Image
              src={profileImage}
              alt="댓글 프로필"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="ml-2 flex items-center body-2">
            <p style={{ color: 'var(--color-gray-900)' }}>
              {item.profile.nickName}
            </p>
            <span className="mx-1" style={{ color: 'var(--color-gray-300)' }}>
              ·
            </span>
            <p style={{ color: 'var(--color-gray-300)' }}>
              {item.reply.lastCreatedTime}
            </p>
          </div>
        </div>

        <div
          className="relative"
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="p-1 transition-opacity hover:opacity-70 cursor-pointer"
            aria-label="댓글 메뉴"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleMenu()
            }}
          >
            <Image
              src="/icons/menu-3dots.svg"
              alt="댓글 메뉴"
              width={24}
              height={24}
            />
          </button>

          {isMenuOpen && (
            <button
              type="button"
              className="absolute right-0 top-8 z-50 block w-[96px] h-[36px] rounded-[4px] overflow-hidden transition-opacity hover:opacity-90"
              style={{ boxShadow: '0 0 8px rgba(0,0,0,0.25)' }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (isMine) onOpenDelete()
                else onOpenReport()
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
                className="block w-[96px] h-[36px] bg-white"
                draggable={false}
              />
            </button>
          )}
        </div>
      </div>

      <p className="body-2" style={{ color: 'var(--color-gray-900)' }}>
        {item.reply.comment}
      </p>

      <div className="flex items-center">
        <button
          type="button"
          className="transition-opacity hover:opacity-70 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLike()
          }}
          aria-label="댓글 좋아요"
        >
          <Image
            src={
              item.reply.isLiked
                ? '/icons/icon-like-pink.svg'
                : '/icons/icon-like.svg'
            }
            alt="좋아요"
            width={24}
            height={24}
          />
        </button>

        {item.reply.likeCount > 0 && (
          <span
            className="ml-1 text-[14px] font-bold leading-[140%]"
            style={{ color: 'var(--color-gray-500)' }}
          >
            {item.reply.likeCount}
          </span>
        )}
      </div>
    </article>
  )
}
