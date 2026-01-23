// src/app/profile/myActivity/components/myComments.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useDeleteFlow } from '@/hooks/useDeleteFlow'
import DeleteFlow from '@/components/common/delete/DeleteFlow'

import { getMyActivityReplies } from '@/api/profile/readerActivity.api'
import { apiClient } from '@/api/axios-instance'

type ActivityReplyItem = {
  profile: {
    userId: number
    profileImageUrl: string | null
    nickName: string
  }
  reply: {
    replyId: number
    userId: number
    boardId: number
    comment: string
    lastCreatedTime: string
    likeCount: number
    isLiked: boolean
  }
}

const FALLBACK_PROFILE = '/profile/profile-default.svg'
const SORT: 'LATEST' = 'LATEST'

const deleteReply = async (boardId: number, replyId: number) => {
  const res = await apiClient.delete(
    `/api/v1/feed/reader/board/${boardId}/reply/${replyId}`,
  )
  return res.data
}

/**
 * ✅ 댓글 좋아요 토글 API
 * 명세에 맞춰 경로/메서드 바꿔야 할 수 있음.
 * (예시) POST /api/v1/feed/reader/board/{boardId}/reply/{replyId}/like
 */
const toggleReplyLike = async (boardId: number, replyId: number) => {
  const res = await apiClient.post(
    `/api/v1/feed/reader/board/${boardId}/reply/${replyId}/like`,
  )
  return res.data
}

export default function MyComments() {
  const router = useRouter()

  // ✅ 스크롤 root / sentinel
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // ✅ 데이터 상태
  const [items, setItems] = useState<ActivityReplyItem[]>([])
  const [page, setPage] = useState(0)
  const [isLast, setIsLast] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  // ✅ 케밥 메뉴 상태
  const [openMenuReplyId, setOpenMenuReplyId] = useState<number | null>(null)
  const openMenuWrapRef = useRef<HTMLDivElement | null>(null)

  // ✅ 좋아요 토글 중(연타 방지)
  const [likePending, setLikePending] = useState<Record<number, boolean>>({})

  const loadFirst = useCallback(async () => {
    setInitLoading(true)
    setIsLoading(true)
    setItems([])
    setPage(0)
    setIsLast(false)

    try {
      const res = await getMyActivityReplies({ sort: SORT, page: 0 })
      setItems(res.content)
      setIsLast(res.last)
      setPage(0)
    } finally {
      setIsLoading(false)
      setInitLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoading || isLast) return
    const next = page + 1
    setIsLoading(true)

    try {
      const res = await getMyActivityReplies({ sort: SORT, page: next })
      setItems((prev) => [...prev, ...res.content])
      setIsLast(res.last)
      setPage(next)
    } finally {
      setIsLoading(false)
    }
  }, [isLast, isLoading, page])

  useEffect(() => {
    loadFirst()
  }, [loadFirst])

  useInfiniteScroll({
    root: scrollRef,
    target: sentinelRef,
    hasNextPage: !isLast,
    isLoading: isLoading,
    onLoadMore: loadMore,
    rootMargin: '200px',
  })

  // ✅ 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!openMenuReplyId) return

    const onPointerDown = (e: PointerEvent) => {
      const wrap = openMenuWrapRef.current
      if (!wrap) return
      if (e.target instanceof Node && wrap.contains(e.target)) return
      setOpenMenuReplyId(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [openMenuReplyId])

  // ✅ 댓글 좋아요 토글 (낙관적 업데이트 + 실패 롤백)
  const handleToggleReplyLike = useCallback(
    async (boardId: number, replyId: number) => {
      if (likePending[replyId]) return

      const current = items.find((x) => x.reply.replyId === replyId)
      if (!current) return

      const prevLiked = current.reply.isLiked
      const prevCount = current.reply.likeCount

      // 1) UI 먼저 반영
      setLikePending((m) => ({ ...m, [replyId]: true }))
      setItems((prev) =>
        prev.map((x) => {
          if (x.reply.replyId !== replyId) return x
          const nextLiked = !x.reply.isLiked
          const nextCount = Math.max(
            0,
            x.reply.likeCount + (nextLiked ? 1 : -1),
          )
          return {
            ...x,
            reply: {
              ...x.reply,
              isLiked: nextLiked,
              likeCount: nextCount,
            },
          }
        }),
      )

      try {
        const data = await toggleReplyLike(boardId, replyId)

        // ✅ 백엔드가 200 + isSuccess:false 방어
        if (data?.isSuccess === false) {
          throw new Error(data?.message ?? '좋아요 처리에 실패했어요.')
        }

        // (선택) 서버가 최신 값 내려주면 동기화
        // const result = data?.result
        // if (result && typeof result.isLiked === 'boolean' && typeof result.likeCount === 'number') {
        //   setItems(prev => prev.map(x => x.reply.replyId === replyId
        //     ? { ...x, reply: { ...x.reply, isLiked: result.isLiked, likeCount: result.likeCount } }
        //     : x
        //   ))
        // }
      } catch (e) {
        // 2) 실패하면 롤백
        setItems((prev) =>
          prev.map((x) => {
            if (x.reply.replyId !== replyId) return x
            return {
              ...x,
              reply: {
                ...x.reply,
                isLiked: prevLiked,
                likeCount: prevCount,
              },
            }
          }),
        )
      } finally {
        setLikePending((m) => {
          const { [replyId]: _, ...rest } = m
          return rest
        })
      }
    },
    [items, likePending],
  )

  // ✅ 삭제 플로우
  const {
    isDeleteOpen,
    deleteTarget,
    deleteDoneOpen,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    closeDeleteDone,
  } = useDeleteFlow<ActivityReplyItem>({
    onConfirm: async (target) => {
      const { boardId, replyId } = target.reply
      const data = await deleteReply(boardId, replyId)
      if (data?.isSuccess === false) {
        throw new Error(data?.message ?? '삭제에 실패했어요.')
      }
      setItems((prev) => prev.filter((x) => x.reply.replyId !== replyId))
      setOpenMenuReplyId(null)
    },
    doneDurationMs: 1500,
  })

  if (initLoading) {
    return (
      <div
        className="px-4 py-8 body-2"
        style={{ color: 'var(--color-gray-400)' }}
      >
        불러오는 중...
      </div>
    )
  }

  if (!initLoading && items.length === 0) {
    return (
      <div
        className="px-4 py-8 body-2"
        style={{ color: 'var(--color-gray-400)' }}
      >
        아직 작성한 댓글이 없어요.
      </div>
    )
  }

  return (
    <>
      <div ref={scrollRef} className="h-full overflow-y-auto">
        {items.map((item) => {
          const profileImage = item.profile.profileImageUrl ?? FALLBACK_PROFILE
          const isMenuOpen = openMenuReplyId === item.reply.replyId
          const isLikePending = !!likePending[item.reply.replyId]

          return (
            <article
              key={item.reply.replyId}
              className="px-4 py-3 flex flex-col gap-3 bg-white cursor-pointer transition-opacity hover:opacity-90"
              style={{ borderBottom: '1px solid var(--color-gray-100)' }}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/feed/article/${item.reply.boardId}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  router.push(`/feed/article/${item.reply.boardId}`)
                }
              }}
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
                    <span
                      className="mx-1"
                      style={{ color: 'var(--color-gray-300)' }}
                    >
                      ·
                    </span>
                    <p style={{ color: 'var(--color-gray-300)' }}>
                      {item.reply.lastCreatedTime}
                    </p>
                  </div>
                </div>

                {/* 🔽 오른쪽 3dots 메뉴 */}
                <div
                  className="relative"
                  ref={isMenuOpen ? openMenuWrapRef : null}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="p-1 transition-opacity hover:opacity-70 cursor-pointer"
                    aria-label="댓글 메뉴"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setOpenMenuReplyId((prev) =>
                        prev === item.reply.replyId ? null : item.reply.replyId,
                      )
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
                        setOpenMenuReplyId(null)
                        openDeleteModal(item)
                      }}
                      aria-label="삭제하기"
                    >
                      <img
                        src="/icons/delete-dropdown.svg"
                        alt="삭제하기"
                        width={96}
                        height={36}
                        className="block w-[96px] h-[36px] bg-white"
                        draggable={false}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* 댓글 내용 */}
              <p
                className="text-[14px] font-medium leading-[140%] break-words"
                style={{ color: 'var(--color-gray-900)' }}
              >
                {item.reply.comment}
              </p>

              {/* ✅ 좋아요 (클릭 가능 + 상세 이동 막기) */}
              <div className="flex items-center">
                <button
                  type="button"
                  className="inline-flex items-center cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
                  disabled={isLikePending}
                  aria-label="좋아요"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleToggleReplyLike(
                      item.reply.boardId,
                      item.reply.replyId,
                    )
                  }}
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
        })}

        <div ref={sentinelRef} style={{ height: 1 }} />

        {isLoading && (
          <div
            className="px-4 py-4 body-2"
            style={{ color: 'var(--color-gray-400)' }}
          >
            불러오는 중...
          </div>
        )}
      </div>

      <DeleteFlow<ActivityReplyItem>
        isDeleteOpen={isDeleteOpen}
        deleteTarget={deleteTarget}
        onCloseDelete={closeDeleteModal}
        onConfirmDelete={confirmDelete}
        deleteDoneOpen={deleteDoneOpen}
        onCloseDone={closeDeleteDone}
        getProfileImage={(t) => t.profile.profileImageUrl ?? FALLBACK_PROFILE}
        getNickname={(t) => t.profile.nickName}
      />
    </>
  )
}
