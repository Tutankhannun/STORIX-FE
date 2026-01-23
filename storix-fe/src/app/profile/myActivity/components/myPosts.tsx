// src/app/profile/myActivity/components/myPosts.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import PostCard from '@/components/common/post/PostCard'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useOpenMenu } from '@/hooks/useOpenMenu'

import { useDeleteFlow } from '@/hooks/useDeleteFlow'
import DeleteFlow from '@/components/common/delete/DeleteFlow'
import { useProfileStore } from '@/store/profile.store'
import {
  getMyActivityBoards,
  type ActivityBoardItem,
} from '@/api/profile/readerActivity.api'
import { apiClient } from '@/api/axios-instance'

const FALLBACK_PROFILE = '/profile/profile-default.svg'
const SORT: 'LATEST' = 'LATEST'

// ✅ 게시글 삭제 API (명세: DELETE /api/v1/feed/reader/board/{boardId})
const deleteBoard = async (boardId: number) => {
  const res = await apiClient.delete(`/api/v1/feed/reader/board/${boardId}`)
  return res.data
}

/**
 * ✅ 좋아요 토글 API
 * 여기 엔드포인트가 프로젝트에 이미 있으면 그걸 쓰면 되고,
 * 없으면 "어떤 API로 좋아요 토글하는지" 알려줘야 정확히 연결 가능.
 *
 * 아래는 예시 (네 프로젝트에서 쓰는 경로로 바꿔야 할 수 있음)
 */
const toggleBoardLike = async (boardId: number) => {
  // 예: POST /api/v1/feed/reader/board/{boardId}/like
  const res = await apiClient.post(`/api/v1/feed/reader/board/${boardId}/like`)
  return res.data
}

export default function MyPosts() {
  const router = useRouter()

  // ✅ 무한스크롤 root/sentinel
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const me = useProfileStore((s) => s.me)
  const myUserId = me?.userId

  // ✅ 점3개 메뉴
  const menu = useOpenMenu<number>()

  // ✅ 상태
  const [items, setItems] = useState<ActivityBoardItem[]>([])
  const [page, setPage] = useState(0)
  const [isLast, setIsLast] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  // ✅ 좋아요 토글 중(연타 방지)
  const [likePending, setLikePending] = useState<Record<number, boolean>>({})

  const loadFirst = useCallback(async () => {
    setInitLoading(true)
    setIsLoading(true)
    setItems([])
    setPage(0)
    setIsLast(false)

    try {
      const res = await getMyActivityBoards({ page: 0, sort: SORT })
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
      const res = await getMyActivityBoards({ page: next, sort: SORT })
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

  // ✅ 좋아요 토글 핸들러 (낙관적 업데이트 + 실패 롤백)
  const handleToggleLike = useCallback(
    async (boardId: number) => {
      if (likePending[boardId]) return

      const current = items.find((x) => x.board.boardId === boardId)
      if (!current) return

      const prevLiked = current.board.isLiked
      const prevCount = current.board.likeCount

      // 1) UI 먼저 바꿈(optimistic)
      setLikePending((m) => ({ ...m, [boardId]: true }))
      setItems((prev) =>
        prev.map((x) => {
          if (x.board.boardId !== boardId) return x
          const nextLiked = !x.board.isLiked
          const nextCount = Math.max(
            0,
            x.board.likeCount + (nextLiked ? 1 : -1),
          )
          return {
            ...x,
            board: {
              ...x.board,
              isLiked: nextLiked,
              likeCount: nextCount,
            },
          }
        }),
      )

      try {
        const data = await toggleBoardLike(boardId)

        // ✅ 백엔드가 200 + isSuccess:false 방어
        if (data?.isSuccess === false) {
          throw new Error(data?.message ?? '좋아요 처리에 실패했어요.')
        }

        // (선택) 서버가 최신 likeCount/isLiked를 내려주면 여기서 동기화 가능
        // 예: data.result에 { isLiked, likeCount } 가 있다면 반영
        // const result = data?.result
        // if (result && typeof result.isLiked === 'boolean' && typeof result.likeCount === 'number') {
        //   setItems(prev => prev.map(x => x.board.boardId === boardId
        //     ? { ...x, board: { ...x.board, isLiked: result.isLiked, likeCount: result.likeCount } }
        //     : x
        //   ))
        // }
      } catch (e) {
        // 2) 실패하면 롤백
        setItems((prev) =>
          prev.map((x) => {
            if (x.board.boardId !== boardId) return x
            return {
              ...x,
              board: {
                ...x.board,
                isLiked: prevLiked,
                likeCount: prevCount,
              },
            }
          }),
        )
      } finally {
        setLikePending((m) => {
          const { [boardId]: _, ...rest } = m
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
  } = useDeleteFlow<ActivityBoardItem>({
    onConfirm: async (target) => {
      const boardId = target.board.boardId
      const data = await deleteBoard(boardId)

      if (data?.isSuccess === false) {
        throw new Error(data?.message ?? '삭제에 실패했어요.')
      }

      setItems((prev) => prev.filter((x) => x.board.boardId !== boardId))
      menu.close()
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
        아직 작성한 글이 없어요.
      </div>
    )
  }

  return (
    <>
      <div ref={scrollRef} className="h-full overflow-y-auto">
        {items.map((item) => {
          const boardId = item.board.boardId

          const images = (item.images ?? [])
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((x) => x.imageUrl)

          return (
            <PostCard
              key={boardId}
              variant="list"
              boardId={boardId}
              writerUserId={item.profile.userId}
              profileImageUrl={item.profile.profileImageUrl ?? FALLBACK_PROFILE}
              nickName={item.profile.nickName}
              createdAt={item.board.lastCreatedTime}
              content={item.board.content}
              images={images}
              works={
                item.works
                  ? {
                      thumbnailUrl: item.works.thumbnailUrl,
                      worksName: item.works.worksName,
                      artistName: item.works.artistName,
                      worksType: item.works.worksType,
                      genre: item.works.genre,
                      hashtags: item.works.hashtags ?? [],
                    }
                  : null
              }
              isLiked={item.board.isLiked}
              likeCount={item.board.likeCount}
              replyCount={item.board.replyCount}
              onClickDetail={() => router.push(`/feed/article/${boardId}`)}
              onToggleLike={() => handleToggleLike(boardId)} // ✅ 여기만 연결하면 됨
              onOpenReport={() => {
                menu.close()
              }}
              onOpenDelete={() => {
                openDeleteModal(item)
                menu.close()
              }}
              isMenuOpen={menu.openId === boardId}
              onToggleMenu={() => menu.toggle(boardId)}
              menuRef={menu.bindRef(boardId)}
              onClickWorksArrow={() => router.push('/feed')}
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

      <DeleteFlow<ActivityBoardItem>
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
