// src/app/profile/components/userProfile.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'

type Props = {
  profileImage?: string
  level: number
  nickname: string
  bio: string
}

export default function UserProfile({
  profileImage,
  level,
  nickname,
  bio,
}: Props) {
  const fallbackImage = '/profile/profile-default.svg'

  return (
    <div className="relative flex items-start px-5 py-7">
      <div className="flex items-start gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={profileImage || fallbackImage}
            alt="프로필 이미지"
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col items-start">
          <div
            className="px-2 py-1 rounded-[50px] text-[10px] font-extrabold leading-[140%] tracking-[0.2px]"
            style={{
              backgroundColor: '#FF80B3',
              color: 'var(--color-gray-900)',
            }}
          >
            Lv.{level}
          </div>

          <p
            className="mt-[7px] text-[18px] font-semibold leading-[140%]"
            style={{ color: 'var(--color-gray-900)' }}
          >
            {nickname}
          </p>

          <p
            className="mt-[7px] text-[14px] font-medium leading-[140%]"
            style={{ color: 'var(--color-gray-600)' }}
          >
            {bio}
          </p>
        </div>
      </div>

      <Link
        href="/profile/fix"
        className="absolute right-5 transition-opacity hover:opacity-70"
        style={{ top: 'calc(28px + 20px + 7px)' }}
      >
        <Image
          src="/icons/arrow-next.svg"
          alt="프로필 수정"
          width={16}
          height={16}
        />
      </Link>
    </div>
  )
}
