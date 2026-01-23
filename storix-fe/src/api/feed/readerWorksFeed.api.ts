// src/api/feed/readerWorksFeed.api.ts
import { apiClient } from '@/api/axios-instance'
import type { FeedSort } from './readerFavoriteWorks.api'

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
    worksId: number
    lastCreatedTime: string
    content: string
    likeCount: number
    replyCount: number
    isSpoiler: boolean
    isLiked: boolean
  }
  images?: FeedBoardImage[]
  works?: FeedWorks | null
}

export type PagedResult<T> = {
  content: T[]
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export type WorksFeedResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: PagedResult<FeedBoardItem>
  timestamp: string
}

export const getFeedBoardsByWorksId = async (args: {
  worksId: number
  page?: number
  sort?: FeedSort
}) => {
  const page = args.page ?? 0
  const sort = args.sort ?? 'LATEST'
  const res = await apiClient.get<WorksFeedResponse>(
    `/api/v1/feed/reader/board/works/${args.worksId}`,
    { params: { page, sort } },
  )
  return res.data
}
