// src/app/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import TopBar from './components/topbar'
import UserProfile from './components/userProfile'
import PreferenceTab from './components/preferenceTab'
import Preference from './components/preference'
import Rating from './components/rating'
import Genre from './components/genre'
import Hashtag from './components/hashtag'
import NavBar from '@/components/common/NavBar'
import { apiClient } from '@/api/axios-instance'
import { useAuthStore } from '@/store/auth.store'

type MeProfileResult = {
  role: string
  profileImageUrl: string | null
  nickName: string
  level?: number
  profileDescription: string | null
}

export default function ProfilePage() {
  const [nickname, setNickname] = useState<string>('')
  const [level, setLevel] = useState<number>(1)
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    undefined,
  )
  const [bio, setBio] = useState<string>('')

  useEffect(() => {
    let mounted = true

    const fetchMe = async () => {
      try {
        const token = useAuthStore.getState().accessToken
        console.log('[profile] accessToken exists?', !!token)

        const res = await apiClient.get('/api/v1/profile/me')

        const result = (res.data as any)?.result as MeProfileResult | undefined
        if (!result) throw new Error('No result in /profile/me response')

        if (!mounted) return

        setNickname(result.nickName ?? '')
        setLevel(typeof result.level === 'number' ? result.level : 1)
        setProfileImageUrl(result.profileImageUrl ?? undefined)
        setBio(result.profileDescription ?? '')
      } catch (e: any) {
        console.error('[profile] failed to fetch /profile/me', e)
        if (!mounted) return
        setNickname('')
        setLevel(1)
        setProfileImageUrl(undefined)
        setBio('')
      }
    }

    fetchMe()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="relative w-full min-h-full pb-[169px]">
      <div className="h-[54px]" />
      <TopBar />

      <UserProfile
        profileImage={profileImageUrl}
        level={level}
        nickname={nickname || '닉네임'}
        bio={bio}
      />

      <PreferenceTab />
      <Preference />
      <Rating />

      {/* ✅ 장르는 기본값 */}
      <Genre />

      <Hashtag />
      <NavBar active="profile" />
    </div>
  )
}
