// src/app/home/page.tsx
'use client'

import { useState } from 'react'
import HomeHeader from '@/components/home/HomeHeader'
import { CardNav } from '@/components/home/todayTopicRoom/CardNav'
import { TopicRoomCoverSlider } from '@/components/home/todayTopicRoom/TopicRoomCoverSlider'
import { TopicRoomData } from '@/components/home/todayTopicRoom/TopicroomCoverCard'
import HotFeedSlider from '@/components/home/hotFeed/HotFeedSlider'
import MyTypeCard from '@/components/home/myType/MyTypeCard'
import HashtagList from '@/components/common/HashtagList'
import NavBar from '@/components/common/NavBar'

const MOCK_ROOMS: TopicRoomData[] = [
  {
    id: 'room1',
    imageUrl: '/sample/topicroom-1.webp', // 일단 public에 더미 이미지 넣어두고 쓰기
    title: '탄서방 시어머니회',
    subtitle: '웹툰 상수리나무 아래',
    memberCount: 13,
  },
  {
    id: 'room2',
    imageUrl: '/sample/topicroom-1.webp',
    title: '탄서방 시어머니회 2',
    subtitle: '웹툰 상수리나무 아래',
    memberCount: 20,
  },
  {
    id: 'room3',
    imageUrl: '/sample/topicroom-1.webp',
    title: '탄서방 시어머니회 3',
    subtitle: '웹툰 상수리나무 아래',
    memberCount: 22,
  },
]

export default function Home() {
  const [active, setActive] = useState<'home' | 'feed' | 'library' | 'profile'>(
    'home',
  )

  return (
    <div className="px-4">
      <HomeHeader />
      <div className="w-full h-full flex flex-col pb-32">
        {/* 위쪽만 스크롤 */}
        <div className="flex-1 flex flex-col gap-[24px] overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col items-center text-center">
            <CardNav header="실시간 작품 이야기!" roomName="topicroom" />
            <TopicRoomCoverSlider rooms={MOCK_ROOMS} />
          </div>

          <div className="flex flex-col w-full">
            <CardNav header="이 작품, 내 취향일까?" roomName="#" />
            <MyTypeCard />
          </div>

          <div className="flex flex-col w-full">
            <CardNav header="오늘의 피드" roomName="#" />
            <HotFeedSlider />
          </div>

          <div className="flex flex-col w-full mb-8">
            <CardNav header="이런 키워드, 좋아하실 것 같아요" roomName="#" />
            <HashtagList />
          </div>
        </div>
      </div>
      <NavBar active={active} onChange={setActive} />
    </div>
  )
}
