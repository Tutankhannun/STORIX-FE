// src/app/feed/FeedPageClient.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import Topbar from './components/topbar'
import HorizontalPicker, { PickerItem } from './components/horizontalPicker'
import FeedList from './components/feedList'
import NavBar from '@/components/common/NavBar'

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import {
  getFeedBoards,
  type FeedBoardItem as AllFeedBoardItem,
} from '@/api/feed/readerFeed.api'
import { toggleBoardLike } from '@/api/feed/readerBoard.api'

// ✅ NEW: 관심작품 picker API
import { getFavoriteWorks } from '@/api/feed/readerFavoriteWorks.api'
// ✅ NEW: worksId 전용 피드 API
import {
  getFeedBoardsByWorksId,
  type FeedBoardItem as WorksFeedBoardItem,
} from '@/api/feed/readerWorksFeed.api'

// ✅ menu + flows + api
import { useOpenMenu } from '@/hooks/useOpenMenu'
import { useReportFlow } from '@/hooks/useReportFlow'
import { useDeleteFlow } from '@/hooks/useDeleteFlow'
import ReportFlow from '@/components/common/report/ReportFlow'
import DeleteFlow from '@/components/common/delete/DeleteFlow'
import { useProfileStore } from '@/store/profile.store'
import { apiClient } from '@/api/axios-instance'
import axios from 'axios'

type Tab = 'works' | 'writers'

export type UIPost = {
  id: number
  workId: string
  isWorksSelected: boolean
  isSpoiler: boolean

  profileImage: string
  nickname: string
  writerUserId: number

  isAuthorPost?: boolean
  user: { profileImage: string; nickname: string }
  createdAt: string

  work: {
    coverImage: string
    title: string
    author: string
    type: string
    genre: string
  }

  hashtags: string[]
  content: string
  isLiked: boolean
  likeCount: number
  commentCount: number
  images?: string[]
}

const FALLBACK_PROFILE = '/profile/profile-default.svg'

/** all-feed / works-feed 둘 다 같은 shape로 매핑 가능하게 */
const mapToUIPost = (item: AllFeedBoardItem | WorksFeedBoardItem): UIPost => {
  const { profile, board, images, works } = item as any
  const isWorksSelected = board.isWorksSelected === true && works != null

  return {
    id: board.boardId,
    workId: isWorksSelected ? String(board.worksId) : '',
    isWorksSelected,

    isSpoiler: board.isSpoiler === true,

    profileImage: profile.profileImageUrl ?? FALLBACK_PROFILE,
    nickname: profile.nickName,
    writerUserId: profile.userId ?? board.userId,

    isAuthorPost: false,
    user: {
      profileImage: profile.profileImageUrl ?? FALLBACK_PROFILE,
      nickname: profile.nickName,
    },

    createdAt: board.lastCreatedTime,

    work: isWorksSelected
      ? {
          coverImage: works!.thumbnailUrl,
          title: works!.worksName,
          author: works!.artistName,
          type: works!.worksType,
          genre: works!.genre,
        }
      : {
          coverImage: '',
          title: '',
          author: '',
          type: '',
          genre: '',
        },

    hashtags: isWorksSelected ? (works!.hashtags ?? []) : [],
    content: board.content,
    isLiked: board.isLiked,
    likeCount: board.likeCount,
    commentCount: board.replyCount,

    images: (images ?? [])
      .slice()
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((x: any) => x.imageUrl),
  }
}

// ✅ 게시글 신고 API
const reportBoard = async (boardId: number, reportedUserId: number) => {
  const res = await apiClient.post(
    `/api/v1/feed/reader/board/${boardId}/report`,
    {
      reportedUserId,
    },
  )
  return res.data
}

// ✅ 게시글 삭제 API
const deleteBoard = async (boardId: number) => {
  const res = await apiClient.delete(`/api/v1/feed/reader/board/${boardId}`)
  return res.data
}

export default function FeedPageClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tab: Tab = searchParams.get('tab') === 'writers' ? 'writers' : 'works'
  const pick = searchParams.get('pick') ?? 'all'

  const replaceQuery = (next: { tab?: Tab; pick?: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next.tab) params.set('tab', next.tab)
    if (typeof next.pick === 'string') params.set('pick', next.pick)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const onChangeTab = (nextTab: Tab) =>
    replaceQuery({ tab: nextTab, pick: 'all' })
  const onPick = (id: string) => replaceQuery({ pick: id })

  // -------------------------
  // Picker: 관심작품 목록(서버)
  // -------------------------
  const [favoriteWorks, setFavoriteWorks] = useState<PickerItem[]>([
    { id: 'all', name: '전체' },
  ])
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    // writers 탭에서도 상단 picker는 “관심작품”을 보여주는 구조라면 그대로 로드해도 되고,
    // 아니라면 여기서 tab === 'works' 조건 걸면 됨.
    let alive = true

    const run = async () => {
      setFavLoading(true)
      try {
        const res = await getFavoriteWorks({ page: 0, sort: 'LATEST' })
        if (!alive) return

        const content = res?.result?.content ?? []
        const items: PickerItem[] = [
          { id: 'all', name: '전체' },
          ...content.map((w) => ({
            id: String(w.worksId),
            name: w.worksName,
            thumbnailUrl: w.thumbnailUrl,
          })),
        ]

        setFavoriteWorks(items)
      } catch (e) {
        if (!alive) return
        // 실패해도 최소 '전체'는 유지
        setFavoriteWorks([{ id: 'all', name: '전체' }])
      } finally {
        if (!alive) return
        setFavLoading(false)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [])

  // -------------------------
  // Feed: 무한스크롤(전체 vs worksId)
  // -------------------------
  const [posts, setPosts] = useState<UIPost[]>([])
  const [feedPage, setFeedPage] = useState(0)
  const [feedLast, setFeedLast] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [likePending, setLikePending] = useState<Record<number, boolean>>({})

  const handleToggleLike = useCallback(
    async (post: UIPost) => {
      const boardId = post.id
      if (likePending[boardId]) return

      // 현재값 저장(롤백용)
      const prevLiked = post.isLiked
      const prevCount = post.likeCount

      // 1) optimistic UI
      setLikePending((m) => ({ ...m, [boardId]: true }))
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== boardId) return p
          const nextLiked = !p.isLiked
          const nextCount = Math.max(0, p.likeCount + (nextLiked ? 1 : -1))
          return { ...p, isLiked: nextLiked, likeCount: nextCount }
        }),
      )

      try {
        const data = await toggleBoardLike(boardId)
        // ✅ data는 { isLiked: boolean; likeCount: number } 형태라고 했으니 그대로 사용 가능

        // (선택) 서버값으로 확정 동기화하고 싶으면 아래처럼
        if (
          data &&
          typeof data.isLiked === 'boolean' &&
          typeof data.likeCount === 'number'
        ) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === boardId
                ? { ...p, isLiked: data.isLiked, likeCount: data.likeCount }
                : p,
            ),
          )
        }
      } catch (e) {
        // 실패 시 롤백
        setPosts((prev) =>
          prev.map((p) =>
            p.id === boardId
              ? { ...p, isLiked: prevLiked, likeCount: prevCount }
              : p,
          ),
        )
      } finally {
        setLikePending((m) => {
          const { [boardId]: _, ...rest } = m
          return rest
        })
      }
    },
    [likePending],
  )

  const mode = useMemo(() => {
    // works 탭에서만 worksId API로 서버 필터링
    if (tab === 'works' && pick !== 'all') return 'WORKS' as const
    return 'ALL' as const
  }, [tab, pick])

  const worksIdNumber = useMemo(() => {
    if (mode !== 'WORKS') return null
    const n = Number(pick)
    return Number.isFinite(n) ? n : null
  }, [mode, pick])

  const resetFeed = useCallback(() => {
    setPosts([])
    setFeedPage(0)
    setFeedLast(false)
    setErrorMsg(null)
  }, [])

  const fetchFeedPage = useCallback(
    async (page: number) => {
      if (loading) return
      // WORKS 모드인데 worksId가 숫자가 아니면 안전하게 종료
      if (mode === 'WORKS' && worksIdNumber == null) {
        setErrorMsg('작품 선택 값이 올바르지 않습니다.')
        setFeedLast(true)
        return
      }

      setLoading(true)
      setErrorMsg(null)

      try {
        if (mode === 'ALL') {
          const res = await getFeedBoards({ page, sort: 'LATEST' })
          const content = res.result.content ?? []
          const mapped = content.map(mapToUIPost)

          setPosts((prev) => (page === 0 ? mapped : [...prev, ...mapped]))
          setFeedLast(res.result.last)
          setFeedPage(page)
          return
        }

        // mode === 'WORKS'
        const res = await getFeedBoardsByWorksId({
          worksId: worksIdNumber!,
          page,
          sort: 'LATEST',
        })
        const content = res.result.content ?? []
        const mapped = content.map(mapToUIPost)

        setPosts((prev) => (page === 0 ? mapped : [...prev, ...mapped]))
        setFeedLast(res.result.last)
        setFeedPage(page)
      } catch (e) {
        setErrorMsg(
          '피드 불러오기에 실패했습니다. 네트워크/인증을 확인해주세요.',
        )
      } finally {
        setLoading(false)
      }
    },
    [loading, mode, worksIdNumber],
  )

  // ✅ tab/pick 변경 시: 리셋 + 0페이지 재조회
  useEffect(() => {
    resetFeed()
    fetchFeedPage(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, worksIdNumber, resetFeed])

  // -------------------------
  // Infinite Scroll Hook
  // -------------------------
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useInfiniteScroll({
    target: sentinelRef,
    hasNextPage: !feedLast,
    isLoading: loading,
    onLoadMore: () => fetchFeedPage(feedPage + 1),
    rootMargin: '300px',
    throttleMs: 500,
  })

  // -------------------------
  // Picker items (탭별)
  // - works 탭: 관심작품 목록(서버)
  // - writers 탭: 지금은 기존처럼 posts 기반으로 만들되, “전용 API 없으니 임시”
  // -------------------------
  const writersItems: PickerItem[] = useMemo(() => {
    const set = new Set<string>()
    for (const p of posts) {
      if (!p.isWorksSelected) continue
      if (p.work.author) set.add(p.work.author)
    }
    return [
      { id: 'all', name: '전체' },
      ...Array.from(set, (name) => ({ id: name, name })),
    ]
  }, [posts])

  const items = tab === 'works' ? favoriteWorks : writersItems

  // =========================================================
  // ✅ 메뉴/신고/삭제 Flow
  // =========================================================
  const me = useProfileStore((s) => s.me)
  const myUserId = me?.userId

  const menu = useOpenMenu<number>()

  const {
    isReportOpen,
    reportTarget,
    reportDoneOpen,
    openReportModal,
    closeReportModal,
    confirmReport,
    closeReportDone,
    toastOpen,
    toastMessage,
    closeToast,
  } = useReportFlow<UIPost>({
    onConfirm: async (target) => {
      try {
        const data = await reportBoard(target.id, target.writerUserId)

        if (data?.isSuccess === false) {
          throw new Error(data?.message ?? '신고에 실패했어요.')
        }

        menu.close()
        return { status: 'ok' as const }
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 400) {
          menu.close()
          return {
            status: 'duplicated' as const,
            message: '이미 신고한 게시글입니다.',
          }
        }
        throw e
      }
    },
    doneDurationMs: 1500,
    duplicatedMessage: '이미 신고한 게시글입니다.',
    toastDurationMs: 1500,
  })

  const {
    isDeleteOpen,
    deleteTarget,
    deleteDoneOpen,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    closeDeleteDone,
  } = useDeleteFlow<UIPost>({
    onConfirm: async (target) => {
      const data = await deleteBoard(target.id)

      if (data?.isSuccess === false) {
        throw new Error(data?.message ?? '삭제에 실패했어요.')
      }

      setPosts((prev) => prev.filter((p) => p.id !== target.id))
      menu.close()
    },
    doneDurationMs: 1500,
  })

  return (
    <div className="relative w-full min-h-full pb-[169px] bg-white">
      <div className="sticky top-0 z-10 bg-white">
        <Topbar activeTab={tab} onChange={onChangeTab} />
      </div>

      {tab !== 'writers' && (
        <HorizontalPicker items={items} selectedId={pick} onSelect={onPick} />
      )}

      {/* =========================
          writers 탭: 준비중 화면
         ========================= */}
      {tab === 'writers' ? (
        <div className="flex flex-col items-center" style={{ marginTop: 196 }}>
          <img
            src="/icons/big-star-pink.svg"
            alt=""
            width={100}
            height={100}
            draggable={false}
          />

          <div className="mt-[22px] text-center">
            <p className="heading-2 text-[var(--gray-900,#100F0F)]">
              오픈 준비 중이에요
            </p>
            <p className="heading-2 text-[var(--gray-900,#100F0F)]">
              조금만 기다려주세요
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* works 탭 기존 피드 */}
          {tab === 'works' && favLoading && (
            <div
              className="px-4 py-2 text-[12px]"
              style={{ color: 'var(--color-gray-500)' }}
            >
              관심 작품 불러오는 중...
            </div>
          )}

          <FeedList
            tab={tab}
            pick={pick}
            posts={posts}
            currentUserId={myUserId}
            menu={menu}
            onOpenReport={(post) => {
              openReportModal(post)
              menu.close()
            }}
            onOpenDelete={(post) => {
              openDeleteModal(post)
              menu.close()
            }}
            onToggleLike={(post) => {
              handleToggleLike(post)
            }}
            onClickWorksArrow={(post) => {
              // TODO
            }}
          />

          {/* sentinel */}
          <div ref={sentinelRef} className="h-10" />

          {errorMsg && (
            <div
              className="px-4 py-3 text-[13px]"
              style={{ color: 'var(--color-gray-600)' }}
            >
              {errorMsg}
            </div>
          )}
          {loading && (
            <div
              className="px-4 py-3 text-[13px]"
              style={{ color: 'var(--color-gray-600)' }}
            >
              불러오는 중...
            </div>
          )}
        </>
      )}

      <ReportFlow<UIPost>
        isReportOpen={isReportOpen}
        reportTarget={reportTarget}
        onCloseReport={closeReportModal}
        onConfirmReport={confirmReport}
        reportDoneOpen={reportDoneOpen}
        onCloseDone={closeReportDone}
        getProfileImage={(t) => t.user.profileImage}
        getNickname={(t) => t.user.nickname}
        toastOpen={toastOpen}
        toastMessage={toastMessage}
        onCloseToast={closeToast}
      />

      <DeleteFlow<UIPost>
        isDeleteOpen={isDeleteOpen}
        deleteTarget={deleteTarget}
        onCloseDelete={closeDeleteModal}
        onConfirmDelete={confirmDelete}
        deleteDoneOpen={deleteDoneOpen}
        onCloseDone={closeDeleteDone}
        getProfileImage={(t) => t.user.profileImage}
        getNickname={(t) => t.user.nickname}
      />

      <NavBar active="feed" />
    </div>
  )
}
