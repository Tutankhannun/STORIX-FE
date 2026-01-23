// src/app/feed/components/feedList.tsx
'use client'

import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { UIPost } from '../FeedPageClient'
import PostCard from '@/components/common/post/PostCard'

type Tab = 'works' | 'writers'

type MenuController<T extends number | string> = {
  openId: T | null
  bindRef: (id: T) => (el: HTMLDivElement | null) => void
  toggle: (id: T) => void
  close: () => void
}

type Props = {
  tab: Tab
  pick: string
  posts: UIPost[]

  // ✅ FeedPageClient에서 내려줌
  menu: MenuController<number>

  currentUserId?: number

  onOpenReport: (post: UIPost) => void
  onOpenDelete: (post: UIPost) => void
  onToggleLike?: (post: UIPost) => void
  onClickWorksArrow?: (post: UIPost) => void
}

export default function FeedList({
  tab,
  pick,
  posts,
  menu,
  currentUserId,
  onOpenReport,
  onOpenDelete,
  onToggleLike,
  onClickWorksArrow,
}: Props) {
  const router = useRouter()

  const filtered = useMemo(() => {
    if (pick === 'all') return posts
    if (tab === 'works') return posts.filter((p) => p.workId === pick)
    return posts.filter((p) => p.work.author === pick)
  }, [posts, pick, tab])

  const goDetail = useCallback(
    (boardId: number) => {
      router.push(`/feed/article/${boardId}`)
    },
    [router],
  )

  return (
    <div>
      {filtered.map((post) => {
        // ✅ 작품 정보가 “정상적으로 존재할 때만” 작품 영역을 렌더링
        // - API 스펙상 작품 미선택이면 works=null 이므로, UI에서도 이 값들이 비어있을 가능성이 큼
        const hasWorks =
          !!post.workId &&
          !!post.work?.coverImage &&
          !!post.work?.title &&
          !!post.work?.author

        return (
          <PostCard
            key={post.id}
            variant="list"
            boardId={post.id}
            writerUserId={post.writerUserId}
            currentUserId={currentUserId}
            profileImageUrl={post.user.profileImage}
            nickName={post.user.nickname}
            createdAt={post.createdAt}
            content={post.content}
            images={post.images ?? []}
            isSpoiler={post.isSpoiler}
            works={
              hasWorks
                ? {
                    thumbnailUrl: post.work.coverImage,
                    worksName: post.work.title,
                    artistName: post.work.author,
                    worksType: post.work.type,
                    genre: post.work.genre,
                    hashtags: post.hashtags ?? [],
                  }
                : undefined
            }
            isLiked={post.isLiked}
            likeCount={post.likeCount}
            replyCount={post.commentCount}
            onClickDetail={() => goDetail(post.id)}
            onToggleLike={() => onToggleLike?.(post)}
            onOpenReport={() => {
              onOpenReport(post)
              menu.close()
            }}
            onOpenDelete={() => {
              onOpenDelete(post)
              menu.close()
            }}
            onClickWorksArrow={
              hasWorks ? () => onClickWorksArrow?.(post) : undefined
            }
            isMenuOpen={menu.openId === post.id}
            onToggleMenu={() => menu.toggle(post.id)}
            menuRef={menu.bindRef(post.id)}
          />
        )
      })}
    </div>
  )
}
