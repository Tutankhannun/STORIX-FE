// src/components/common/post/PostCard.tsx
'use client'

import Image from 'next/image'
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useProfileStore } from '@/store/profile.store'

type Work = {
  thumbnailUrl: string
  worksName: string
  artistName: string
  worksType: string
  genre: string
  hashtags: string[]
}

type Variant = 'list' | 'detail'

type Props = {
  variant?: Variant
  boardId: number
  profileImageUrl: string
  nickName: string
  createdAt: string
  content: string
  images: string[]
  works?: Work | null

  // ✅ NEW: spoiler flag
  isSpoiler?: boolean

  isLiked: boolean
  likeCount: number
  replyCount: number
  onClickDetail?: () => void
  onToggleLike: () => void
  onOpenReport: () => void
  isMenuOpen: boolean
  onToggleMenu: () => void
  menuRef: (el: HTMLDivElement | null) => void
  onClickWorksArrow?: () => void
  writerUserId: number
  onOpenDelete?: () => void
  currentUserId?: number
}

function HashtagRow({ tags }: { tags: string[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [visibleCount, setVisibleCount] = useState(tags.length)

  const recompute = () => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    const containerW = container.clientWidth
    const nodes = Array.from(measure.children) as HTMLElement[]

    let used = 0
    let count = 0
    const gap = 4 // gap-1 = 0.25rem = 4px

    for (let i = 0; i < nodes.length; i++) {
      const w = nodes[i].offsetWidth
      const next = count === 0 ? w : used + gap + w
      if (next <= containerW) {
        used = next
        count++
      } else {
        break
      }
    }

    setVisibleCount(count)
  }

  // tags 바뀌면 다시 계산
  useLayoutEffect(() => {
    setVisibleCount(tags.length)
    // 다음 프레임에 실제 DOM 폭 측정
    requestAnimationFrame(recompute)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags.join('|')])

  // 리사이즈 대응(PWA/회전/뷰포트 변경)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => recompute())
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleTags = useMemo(
    () => tags.slice(0, visibleCount),
    [tags, visibleCount],
  )

  if (!tags.length) return null

  return (
    <div className="w-full max-w-full overflow-hidden" ref={containerRef}>
      {/* 실제 렌더 */}
      <div className="inline-flex gap-1 whitespace-nowrap">
        {visibleTags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="shrink-0 px-2 py-[6px] rounded text-[10px] font-medium leading-[140%] tracking-[0.2px]
              border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] text-[var(--color-gray-800)]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 폭 측정용(화면에는 안 보임) */}
      <div
        ref={measureRef}
        className="absolute -left-[9999px] -top-[9999px] inline-flex gap-1 whitespace-nowrap pointer-events-none opacity-0"
        aria-hidden="true"
      >
        {tags.map((tag, index) => (
          <span
            key={`m-${tag}-${index}`}
            className="shrink-0 px-2 py-[6px] rounded text-[10px] font-medium leading-[140%] tracking-[0.2px]
              border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] text-[var(--color-gray-800)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PostCard({
  variant = 'list',
  boardId,
  profileImageUrl,
  nickName,
  createdAt,
  content,
  images,
  works,
  isSpoiler = false,
  isLiked,
  likeCount,
  replyCount,
  writerUserId,
  onOpenDelete,
  onClickDetail,
  onToggleLike,
  onOpenReport,
  isMenuOpen,
  onToggleMenu,
  menuRef,
  onClickWorksArrow,
  currentUserId,
}: Props) {
  const clickable = variant === 'list'

  const showWorks =
    !!works?.thumbnailUrl && !!works?.worksName && !!works?.artistName

  const me = useProfileStore((s) => s.me)
  const myUserId = currentUserId ?? me?.userId
  const isMine = myUserId != null && writerUserId === myUserId

  // =========================================================
  // ✅ Spoiler overlay: 1st click reveals, next click opens detail
  // =========================================================
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)
  const isSpoilerHidden = isSpoiler && !spoilerRevealed

  const revealSpoiler = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    setSpoilerRevealed(true)
  }

  const bodyProps = clickable
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': '게시글 상세 보기',
        onClick: (e: React.MouseEvent) => {
          if (isSpoilerHidden) {
            e.preventDefault()
            revealSpoiler(e)
            return
          }
          onClickDetail?.()
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (isSpoilerHidden) {
              revealSpoiler(e)
              return
            }
            onClickDetail?.()
          }
        },
        className: 'cursor-pointer transition-opacity hover:opacity-90',
      }
    : { className: '' }

  return (
    <div
      className="py-5"
      style={{
        borderBottom: '1px solid var(--color-gray-100)',
        backgroundColor: 'var(--color-white)',
      }}
    >
      {/* 상단 프로필 한 줄(클릭 제외) */}
      <div
        className="px-4 flex items-center justify-between h-[41px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--color-gray-200)]">
            <Image
              src={profileImageUrl}
              alt="프로필"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <p
              className="text-[16px] font-medium leading-[140%]"
              style={{ color: 'var(--color-gray-900)' }}
            >
              {nickName}
            </p>
            <p
              className="mt-[2px] text-[12px] font-medium leading-[140%]"
              style={{ color: 'var(--color-gray-300)' }}
            >
              {createdAt}
            </p>
          </div>
        </div>

        {/* 점3개 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="w-6 h-6 cursor-pointer transition-opacity hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMenu()
            }}
            aria-label="메뉴"
          >
            <Image
              src="/icons/menu-3dots.svg"
              alt="메뉴"
              width={24}
              height={24}
            />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-[30px] z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="block w-[96px] h-[36px] rounded-[4px] overflow-hidden transition-opacity hover:opacity-90"
                style={{ boxShadow: '0 0 8px rgba(0,0,0,0.25)' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleMenu()
                  if (isMine) onOpenDelete?.()
                  else onOpenReport()
                }}
                aria-label={isMine ? '삭제하기' : '신고하기'}
              >
                <img
                  src={
                    isMine
                      ? '/icons/delete-dropdown.svg'
                      : '/icons/comment-dropdown.svg'
                  }
                  alt={isMine ? '삭제하기' : '신고하기'}
                  width={96}
                  height={36}
                  className="block w-[96px] h-[36px] bg-white"
                  draggable={false}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 작품 정보(클릭 제외) */}
      {showWorks && (
        <div className="mt-5 px-4" onClick={(e) => e.stopPropagation()}>
          <div className="p-3 rounded-xl flex items-center gap-3 border border-[var(--color-gray-100)] bg-[var(--color-white)]">
            {/* 썸네일 */}
            <div className="w-[62px] h-[83px] rounded bg-[var(--color-gray-200)] shrink-0 overflow-hidden">
              <Image
                src={works.thumbnailUrl}
                alt="작품 썸네일"
                width={62}
                height={83}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 텍스트 + 화살표 */}
            <div className="flex w-full items-stretch min-w-0">
              <div className="flex flex-col gap-1 min-w-0 w-full">
                <p className="text-[16px] font-medium leading-[140%] truncate text-[var(--color-black)]">
                  {works.worksName}
                </p>

                <p className="text-[12px] font-medium leading-[140%] text-[var(--color-gray-500)]">
                  {works.artistName} · {works.worksType} · {works.genre}
                </p>

                {/* ✅ 잘리는 해시태그는 아예 렌더 X */}
                <HashtagRow tags={works.hashtags ?? []} />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onClickWorksArrow?.()
                }}
                className="ml-auto pl-3 flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer shrink-0"
                aria-label="작품 상세 보기"
              >
                <Image
                  src="/icons/icon-arrow-forward-small.svg"
                  alt="작품 상세"
                  width={24}
                  height={24}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 본문/이미지/반응 */}
      <div {...(bodyProps as any)}>
        <div className="relative">
          {/* 실제 컨텐츠 (스포일러면 blur) */}
          <div className={isSpoilerHidden ? 'select-none' : ''}>
            {images.length > 0 && (
              <div className="mt-4 px-4">
                <div className="overflow-x-auto">
                  <div className="flex gap-3">
                    {images.slice(0, 3).map((src, idx) => (
                      <div
                        key={`${boardId}-img-${idx}`}
                        className="w-[236px] h-[236px] rounded-[12px] overflow-hidden flex-shrink-0"
                        style={{
                          border: '1px solid var(--color-gray-100)',
                          background: 'lightgray',
                        }}
                      >
                        <Image
                          src={src}
                          alt={`피드 이미지 ${idx + 1}`}
                          width={236}
                          height={236}
                          className={[
                            'w-full h-full object-cover rounded-[8px]',
                            isSpoilerHidden ? 'blur-md' : '',
                          ].join(' ')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 px-4">
              <p
                className={[
                  variant === 'list'
                    ? 'text-[14px] font-medium leading-[140%] line-clamp-3 pr-10'
                    : 'whitespace-pre-wrap body-2 pr-10',
                  isSpoilerHidden ? 'blur-md' : '',
                ].join(' ')}
                style={{ color: 'var(--color-gray-800)' }}
              >
                {content}
              </p>
            </div>

            <div className={isSpoilerHidden ? 'blur-md' : ''}>
              <div className="mt-5 px-4 flex items-center">
                <button
                  type="button"
                  className="flex items-center transition-opacity hover:opacity-70 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleLike()
                  }}
                  aria-label="좋아요"
                >
                  <Image
                    src={
                      isLiked
                        ? '/icons/icon-like-pink.svg'
                        : '/icons/icon-like.svg'
                    }
                    alt="좋아요"
                    width={24}
                    height={24}
                  />
                  {likeCount > 0 && (
                    <span
                      className="ml-1 text-[14px] font-bold leading-[140%]"
                      style={{ color: 'var(--color-gray-500)' }}
                    >
                      {likeCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center ml-4">
                  <Image
                    src="/icons/icon-comment.svg"
                    alt="댓글"
                    width={24}
                    height={24}
                  />
                  {replyCount > 0 && (
                    <span
                      className="ml-1 text-[14px] font-bold leading-[140%]"
                      style={{ color: 'var(--color-gray-500)' }}
                    >
                      {replyCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 스포일러 덮개 */}
          {isSpoilerHidden && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center"
              onClick={revealSpoiler}
              onPointerDown={(e) => e.stopPropagation()}
              role="button"
              tabIndex={0}
              aria-label="스포일러 보기"
            >
              <div
                className="absolute inset-0"
                style={{ background: 'rgba(255,255,255,0.70)' }}
              />

              <div
                className="relative px-4 py-3 rounded-[12px] text-center"
                style={{
                  border: '1px solid var(--color-gray-100)',
                  background: 'var(--color-white)',
                  boxShadow: '0 0 8px rgba(0,0,0,0.08)',
                }}
              >
                <p
                  className="text-[14px] font-semibold leading-[140%]"
                  style={{ color: 'var(--color-gray-900)' }}
                >
                  스포일러가 포함된 게시글입니다
                </p>
                <p
                  className="mt-1 text-[12px] font-medium leading-[140%]"
                  style={{ color: 'var(--color-gray-500)' }}
                >
                  탭해서 내용을 확인하세요
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
