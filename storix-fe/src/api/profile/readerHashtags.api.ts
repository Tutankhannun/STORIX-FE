import { apiClient } from '@/api/axios-instance'

export type HashtagRankingResponse = {
  rankings: Record<number, string>
}

export const getPreferredHashtags = async () => {
  const res = await apiClient.get<{
    isSuccess: boolean
    result: HashtagRankingResponse
  }>('/api/v1/profile/reader/hashtags')

  return res.data.result.rankings
}
