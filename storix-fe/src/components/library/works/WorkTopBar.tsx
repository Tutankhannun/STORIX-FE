//src/components/library/works/WorkTopBar.tsx
'use client'


type Props = {
  onBack: () => void
  isLiked: boolean
  onToggleLike: () => void
}

export default function WorkTopBar({ onBack, isLiked, onToggleLike }: Props) {
  return (
    <div className="sticky top-0 z-10 flex h-14 items-center justify-between bg-white px-4">
      <button
        type="button"
        onClick={onBack}
        className="flex h-8 w-8 items-center justify-center cursor-pointer"
        aria-label="뒤로가기"
      >
        <img src="/icons/back.svg" alt="back" width="24" height="24" loading="lazy" />
      </button>

      <button
        type="button"
        onClick={onToggleLike}
        className="flex items-center gap-1 cursor-pointer"
        aria-label="관심"
      >
        <img src={isLiked ? "/icons/icon-add-active.svg" : "/icons/icon-add-deactive.svg"} alt="like" width="20" height="20" loading="lazy" />
        {isLiked ? (
          <span className="body-2 text-black">관심중</span>
        ) : (
          <span className="body-2 text-gray-400">관심</span>
        )}
      </button>
    </div>
  )
}
