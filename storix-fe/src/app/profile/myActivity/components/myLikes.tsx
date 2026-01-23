// src/app/profile/myActivity/components/myLikes.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { ReportConfirmOutcome } from '@/hooks/useReportFlow'

import {
  getMyActivityLikes,
  type ActivityBoardItem,
} from '@/api/profile/readerActivity.api'

import BoardCard, {
  type BoardCardData,
} from '@/components/common/board/BoardCard'

import { apiClient } from '@/api/axios-instance'
import axios from 'axios'
import {
  reportBoard,
  deleteBoard as deleteBoardApi,
} from '@/api/feed/readerBoard.api'

/**
 * ✅ 게시글 좋아요 토글 API
 * POST /api/v1/feed/reader/board/{boardId}/like
 */
const toggleBoardLike = async (boardId: number) => {
  const res = await apiClient.post(`/api/v1/feed/reader/board/${boardId}/like`)
  return res.data
}

/**
 * ✅ "이미 신고" 판별(백엔드가 400/409 등으로 줄 수 있어 방어)
 */
const isDuplicatedReportError = (err: unknown) => {
  if (!axios.isAxiosError(err)) return false
  const status = err.response?.status
  const data: any = err.response?.data
  if (status !== 400 && status !== 409) return false

  const msg = String(data?.message ?? '')
  const code = String(data?.code ?? '').toUpperCase()

  return (
    (msg.includes('이미') && msg.includes('신고')) ||
    code.includes('ALREADY') ||
    code.includes('DUPLICATE')
  )
}

export default function MyLikes() {
  const router = useRouter()

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const [items, setItems] = useState<ActivityBoardItem[]>([])
  const [page, setPage] = useState(0)
  const [isLast, setIsLast] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  // ✅ 연타 방지
  const [likePending, setLikePending] = useState<Record<number, boolean>>({})

  const loadFirst = useCallback(async () => {
    setInitLoading(true)
    setIsLoading(true)
    setItems([])
    setPage(0)
    setIsLast(false)

    try {
      const res = await getMyActivityLikes({ page: 0, sort: 'LATEST' })
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
      const res = await getMyActivityLikes({ page: next, sort: 'LATEST' })
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
    isLoading,
    onLoadMore: loadMore,
    rootMargin: '200px',
  })

  /**
   * ✅ 좋아요 해제(토글) 핸들러: 성공 시 목록에서 제거, 실패 시 롤백
   */
  const handleUnlike = useCallback(
    async (boardId: number) => {
      if (likePending[boardId]) return

      const current = items.find((x) => x.board.boardId === boardId)
      if (!current) return

      const prevItem = current

      // 1) UI 먼저 반영: 좋아요 목록이므로 제거
      setLikePending((m) => ({ ...m, [boardId]: true }))
      setItems((prev) => prev.filter((x) => x.board.boardId !== boardId))

      try {
        const data = await toggleBoardLike(boardId)
        if (data?.isSuccess === false) {
          throw new Error(data?.message ?? '좋아요 해제에 실패했어요.')
        }
      } catch (e) {
        // 2) 실패 롤백 (원래 위치는 모르니 앞에 붙임)
        setItems((prev) => [prevItem, ...prev])
      } finally {
        setLikePending((m) => {
          const { [boardId]: _, ...rest } = m
          return rest
        })
      }
    },
    [items, likePending],
  )

  /**
   * ✅ 게시글 신고: BoardCard가 duplicated 토스트 띄울 수 있게 outcome 반환
   */
  const handleReportConfirm = useCallback(
    async (args: {
      boardId: number
      reportedUserId: number
    }): Promise<ReportConfirmOutcome> => {
      try {
        // ✅ 너가 올린 reportBoard는 ReportBoardResult를 return(throw 아님)
        const out = await reportBoard({
          boardId: args.boardId,
          reportedUserId: args.reportedUserId,
        })

        if (out.status === 'duplicated') {
          return {
            status: 'duplicated',
            message: out.message || '이미 신고한 게시글입니다.',
          }
        }

        return { status: 'ok' }
      } catch (err) {
        // 혹시 다른 구현/서버가 throw로 중복을 주는 케이스까지 방어
        if (isDuplicatedReportError(err)) {
          return { status: 'duplicated', message: '이미 신고한 게시글입니다.' }
        }
        throw err
      }
    },
    [],
  )

  /**
   * ✅ 게시글 삭제(필요 없으면 BoardCard에 안 넘겨도 됨)
   */
  const handleDeleteConfirm = useCallback(async (args: { boardId: number }) => {
    const data = await deleteBoardApi(args.boardId)
    if (data?.isSuccess === false) {
      throw new Error(data?.message ?? '삭제에 실패했어요.')
    }
    // 좋아요 목록에서 삭제된 글은 제거
    setItems((prev) => prev.filter((x) => x.board.boardId !== args.boardId))
    // 원하면 상세/목록 리프레시도 가능
    // loadFirst()
  }, [])

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
        아직 좋아요 누른 글이 없어요.
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      {items.map((it) => {
        const data: BoardCardData = {
          boardId: it.board.boardId,
          profile: {
            profileImageUrl: it.profile.profileImageUrl,
            nickName: it.profile.nickName,
          },
          board: {
            userId: it.board.userId,
            lastCreatedTime: it.board.lastCreatedTime,
            content: it.board.content,
            likeCount: it.board.likeCount,
            replyCount: it.board.replyCount,
            isLiked: it.board.isLiked,
          },
          images: it.images?.map((x) => ({
            imageUrl: x.imageUrl,
            sortOrder: x.sortOrder,
          })),
          works: it.works
            ? {
                thumbnailUrl: it.works.thumbnailUrl,
                worksName: it.works.worksName,
                artistName: it.works.artistName,
                worksType: it.works.worksType,
                genre: it.works.genre,
                hashtags: it.works.hashtags,
              }
            : null,
        }

        return (
          <BoardCard
            key={data.boardId}
            data={data}
            to={`/feed/article/${data.boardId}`}
            onToggleLike={() => handleUnlike(data.boardId)}
            onReportConfirm={handleReportConfirm}
            onDeleteConfirm={handleDeleteConfirm}
          />
        )
      })}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isLoading && (
        <div className="px-4 py-4" style={{ color: 'var(--color-gray-400)' }}>
          불러오는 중...
        </div>
      )}
    </div>
  )
}
