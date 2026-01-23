'use client'

import { useEffect, useState } from 'react'
import { getPreferredHashtags } from '@/api/profile/readerHashtags.api'

export default function Hashtag() {
  const [ranks, setRanks] = useState<Record<number, string>>({})

  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        const data = await getPreferredHashtags()

        // ✅ 키워드 앞에 # 붙이기
        const withSharp = Object.fromEntries(
          Object.entries(data).map(([rank, keyword]) => [
            Number(rank),
            keyword ? `#${keyword}` : '',
          ]),
        )

        setRanks(withSharp)
      } catch (e) {
        console.error('선호 해시태그 조회 실패', e)
      }
    }

    fetchHashtags()
  }, [])

  return (
    <div className="px-4 py-8">
      <h2 className="text-[18px] font-semibold leading-[140%] text-[var(--color-gray-900)]">
        선호 해시태그
      </h2>

      <div className="mt-[56px] w-full h-[178px] relative">
        {/* 4위 */}
        <p
          className="absolute body-1 text-[var(--color-gray-500)]"
          style={{ left: 205, top: 0, fontFamily: 'Pretendard' }}
        >
          {ranks[4] || ''}
        </p>

        {/* 3위 */}
        <p
          className="absolute text-[18px] font-semibold leading-[140%] text-[var(--color-magenta-200)]"
          style={{ left: 90, top: 22.4, fontFamily: 'Pretendard' }}
        >
          {ranks[3] || ''}
        </p>

        {/* 1위 */}
        <p
          className="absolute heading-1 text-[var(--color-magenta-400)]"
          style={{ left: 138, top: 47.6, fontFamily: 'Pretendard' }}
        >
          {ranks[1] || ''}
        </p>

        {/* 2위 */}
        <p
          className="absolute heading-2 text-[var(--color-primary-main)]"
          style={{ left: 211, top: 81.2, fontFamily: 'Pretendard' }}
        >
          {ranks[2] || ''}
        </p>

        {/* 5위 */}
        <p
          className="absolute body-2 text-[var(--color-gray-400)]"
          style={{ left: 120, top: 109.2, fontFamily: 'Pretendard' }}
        >
          {ranks[5] || ''}
        </p>
      </div>
    </div>
  )
}
