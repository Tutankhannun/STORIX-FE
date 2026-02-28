//src/components/library/works/WorkHeaderCover.tsx
'use client'


type UIData = {
  id: number
  title: string
  metaAuthor: string
  thumb: string
  rating: number
  reviewCount: number
  worksType: string
}

function Star({ value }: { value: number }) {
  return (
    <span className="caption-1 text-[var(--color-magenta-300)]">
      <img src="/search/littleStar.svg" alt="star" width="9" height="10" className="inline-block mb-0.5" loading="lazy" />{' '}
      {Number.isFinite(value) ? value.toFixed(1) : '0.0'}
    </span>
  )
}

type Props = {
  ui: UIData
  isCheckingRoom: boolean
  onReviewWrite: () => void
  onTopicroomEnter: () => void
}

export default function WorkHeaderCover({
  ui,
  isCheckingRoom,
  onReviewWrite,
  onTopicroomEnter,
}: Props) {
  return (
    <div className="relative">
      {/* watermark bg */}
      <div
        className="pointer-events-none w-full h-full absolute inset-0 z-10 opacity-40"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(255,255,255,0) 0%, #fff 100%),
                    linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 100%),
                    url("${ui.thumb || '/image/sample/topicroom-1.webp'}")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '50% 50%',
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 px-4 pb-4">
        <div className="mt-2 flex flex-col items-center">
          <div className="relative h-[280px] w-[210px] overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
            {/* 외부 URL 썸네일 안전하게 */}
            <img
              src={ui.thumb}
              alt={ui.title}
              className="h-full w-full object-cover"
            />
          </div>

          <p className="heading-3 mt-4 text-black text-center">{ui.title}</p>
          <p className="body-2 mt-2 text-gray-500 text-center">
            {ui.metaAuthor}
          </p>

          <div className="mt-2">
            <span className="caption-1 text-[var(--color-magenta-300)] mr-3">
              {ui.worksType}{' '}
            </span>
            <Star value={ui.rating} />
          </div>
        </div>
      </div>
    </div>
  )
}
