// src/api/feed/readerFavoriteWorks.api.ts
import { apiClient } from '@/api/axios-instance'

export type FeedSort = 'LATEST'

export type FavoriteWorkItem = {
  worksId: number
  thumbnailUrl: string
  worksName: string
}

export type FavoriteWorksResult = {
  content: FavoriteWorkItem[]
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export type FavoriteWorksResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: FavoriteWorksResult
  timestamp: string
}

export const getFavoriteWorks = async (params?: {
  page?: number
  sort?: FeedSort
}) => {
  const page = params?.page ?? 0
  const sort = params?.sort ?? 'LATEST'
  const res = await apiClient.get<FavoriteWorksResponse>(
    `/api/v1/feed/reader/board/favorite/works`,
    { params: { page, sort } },
  )
  return res.data
}
