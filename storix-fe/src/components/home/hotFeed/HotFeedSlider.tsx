// src/components/home/hotfeed/HotFeedSlider.tsx

import { HotFeedCard } from '@/components/home/hotFeed/HotFeedCard'

export default function HotFeedSlider() {
  return (
    <section>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 -mx-4">
        <HotFeedCard className="flex bg-gray-100" />
        <HotFeedCard className="flex bg-gray-100" />
        <HotFeedCard className="flex bg-gray-100" />
        <HotFeedCard className="flex bg-gray-100" />
        <HotFeedCard className="flex bg-gray-100" />
      </div>
    </section>
  )
}
