// src/components/home/notify/NotifyCard.tsx
'use client'


export interface NotifyCardProps {
  title: string // [이벤트] 당신의 최애캐를 소개하세요!(~3/10)
  description: string // 당신의 최애캐를 소개하는 웹소설 환상의 입덕쇼!
  date: string // 2025.11.09
  thumbnailSrc?: string // 왼쪽 동그란 썸네일 이미지 (옵션)
  className?: string // 바깥 여백 조정용
}

export default function NotifyCard({
  title,
  description,
  date,
  className = '',
}: NotifyCardProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-start gap-4 rounded-2xl bg-white px-4 py-4 border-bottom">
        {/* 왼쪽 동그란 썸네일 */}
        <div className="mt-1 h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
          <img src="/common/icons/notification-gray.svg" alt="STORIX" width="24" height="24" loading="lazy" />
        </div>

        {/* 오른쪽 텍스트 영역 */}
        <div className="flex-1">
          <p className="body-2 leading-snug text-black">{title}</p>

          <p className="mt-1 caption-1 leading-snug text-gray-400">
            {description}
          </p>

          <p className="mt-3 caption-1 text-gray-400">{date}</p>
        </div>
      </div>
    </div>
  )
}
