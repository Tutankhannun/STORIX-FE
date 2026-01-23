// src/api/feed/readerBoard.api.ts
import { apiClient } from '@/api/axios-instance'
import axios from 'axios'

export type FeedSort = 'LATEST'

export const deleteBoard = async (boardId: number) => {
  const res = await apiClient.delete(`/api/v1/feed/reader/board/${boardId}`)
  return res.data
}

export type FeedBoardImage = {
  boardId: number
  imageUrl: string
  sortOrder: number
}

export type FeedWorks = {
  worksId: number
  thumbnailUrl: string
  worksName: string
  artistName: string
  worksType: string
  genre: string
  hashtags: string[]
}

export type FeedBoardItem = {
  profile: {
    userId: number
    profileImageUrl: string | null
    nickName: string
  }
  board: {
    userId: number
    boardId: number
    isWorksSelected: boolean
    worksId?: number
    lastCreatedTime: string
    content: string
    likeCount: number
    replyCount: number

    // ✅ NEW: 스포일러 여부 (피드/works 피드 응답에 존재)
    isSpoiler?: boolean

    isLiked: boolean
  }
  images: FeedBoardImage[]
  works: FeedWorks | null
}

export type PageResult<T> = {
  numberOfElements: number
  size: number
  content: T[]
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export type ApiResponse<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

export const getAllBoards = async (params: {
  page: number
  sort?: FeedSort
}) => {
  const { data } = await apiClient.get<ApiResponse<PageResult<FeedBoardItem>>>(
    '/api/v1/feed/reader/board',
    { params: { sort: params.sort ?? 'LATEST', page: params.page } },
  )
  return data.result
}

export const getBoardsByWorksId = async (params: {
  worksId: number
  page: number
  sort?: FeedSort
}) => {
  const { data } = await apiClient.get<ApiResponse<PageResult<FeedBoardItem>>>(
    `/api/v1/feed/reader/board/works/${params.worksId}`,
    { params: { sort: params.sort ?? 'LATEST', page: params.page } },
  )
  return data.result
}

export const toggleBoardLike = async (boardId: number) => {
  const { data } = await apiClient.post<
    ApiResponse<{ isLiked: boolean; likeCount: number }>
  >(`/api/v1/feed/reader/board/${boardId}/like`)
  return data.result
}

/** ✅ 신고 결과 타입 */
export type ReportBoardResult =
  | { status: 'ok' }
  | { status: 'duplicated'; message: string }

/**
 * 독자 게시물 신고
 * POST /api/v1/feed/reader/board/{boardId}/report
 * body: { reportedUserId: number }
 *
 * ✅ 중복 신고(400)면 throw하지 않고 duplicated 반환
 */
export const reportBoard = async (params: {
  boardId: number
  reportedUserId: number
}): Promise<ReportBoardResult> => {
  try {
    await apiClient.post<ApiResponse<{}>>(
      `/api/v1/feed/reader/board/${params.boardId}/report`,
      { reportedUserId: params.reportedUserId },
    )
    return { status: 'ok' }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      const body = err.response?.data as any

      // ✅ 서버가 "이미 신고함"을 400으로 내려주는 케이스를 UX로 흡수
      if (status === 400) {
        // 서버 message가 있으면 그걸 쓰고, 없으면 기본 문구
        const msg =
          typeof body?.message === 'string' && body.message.trim().length > 0
            ? body.message
            : '이미 신고한 글이에요.'
        return { status: 'duplicated', message: msg }
      }
    }

    // 그 외는 진짜 실패
    throw err
  }
}
