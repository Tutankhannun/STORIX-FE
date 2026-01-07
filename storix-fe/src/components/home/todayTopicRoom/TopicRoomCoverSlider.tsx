// src/components/home/todayTopicrsoom/TopicRoomCoverSlider.tsx
'use client'

import {
  TopicRoomCoverCard,
  TopicRoomData,
} from '@/components/home/todayTopicRoom/TopicroomCoverCard'

/** 토픽룸 커버 슬라이더(가로 스크롤) */
interface TopicRoomCoverSliderProps {
  rooms: TopicRoomData[]
}

export const TopicRoomCoverSlider = ({ rooms }: TopicRoomCoverSliderProps) => {
  return (
    <section className="w-full">
      <div className="flex h-[354px] overflow-x-auto no-scrollbar px-4 -mx-4">
        {rooms.map((room, index) => (
          <div
            key={room.id}
            className={`flex-shrink-0 ${index !== rooms.length - 1 ? 'mr-3' : ''}`}
          >
            <TopicRoomCoverCard room={room} />
          </div>
        ))}
      </div>
    </section>
  )
}
