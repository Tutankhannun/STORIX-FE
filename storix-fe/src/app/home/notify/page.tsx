// src/app/home/notify/page.tsx

import TopNotifyNavigation from '@/components/home/notify/TopNotifyNavigation'
import NotifyList from '@/components/home/notify/NotifyList'

const NOTIFY_ITEMS = [
  {
    title: '[이벤트] 당신의 최애캐를 소개하세요!(~3/10)',
    description: '당신의 최애캐를 소개하는 웹소설 환상의 입덕쇼!',
    date: '2025.11.09',
    thumbnailSrc: '',
  },
  {
    title: '[이벤트] 당신의 최애캐를 소개하세요!(~3/10)',
    description: '당신의 최애캐를 소개하는 웹소설 환상의 입덕쇼!',
    date: '2025.11.09',
    thumbnailSrc: '',
  },
  {
    title: '[이벤트] 당신의 최애캐를 소개하세요!(~3/10)',
    description: '당신의 최애캐를 소개하는 웹소설 환상의 입덕쇼!',
    date: '2025.11.09',
    thumbnailSrc: '/sample/topicroom-1.jpg',
  },
]

export default function notify() {
  return (
    <div>
      <TopNotifyNavigation />
      <NotifyList items={NOTIFY_ITEMS} />
    </div>
  )
}
