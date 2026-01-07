// src/app/profile/myActivity/page.tsx
'use client'

import { useEffect, useState } from 'react'
import TopBar from '../components/topbar'
import UserProfile from '../components/userProfile'
import PreferenceTab from '../components/preferenceTab'
import Selectbar from './components/selectBar'
import MyPosts from './components/myPosts'
import MyComments from './components/myComments'
import MyLikes from './components/myLikes'
import NavBar from '@/components/common/NavBar'

export default function MyActivityPage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'likes'>(
    'posts',
  )
  const [nickname, setNickname] = useState<string>('')

  useEffect(() => {
    const saved = sessionStorage.getItem('signup_nickname') ?? ''
    setNickname(saved)
    console.log('[myActivity] local nickname:', saved)
  }, [])

  return (
    // ✅ profile/page.tsx와 동일하게 하단 여백 확보
    <div className="relative w-full min-h-full pb-[169px]">
      <div className="h-[54px]" />
      <TopBar />

      <UserProfile
        profileImage={undefined}
        level={1}
        nickname={nickname || '닉네임'}
        bio={''}
      />

      <PreferenceTab />

      {/* 게시글/댓글/좋아요 탭 */}
      <Selectbar activeTab={activeTab} onChange={setActiveTab} />

      {/* 선택된 탭에 따른 컨텐츠 */}
      {activeTab === 'posts' && <MyPosts />}
      {activeTab === 'comments' && <MyComments />}
      {activeTab === 'likes' && <MyLikes />}

      <NavBar active="profile" />
    </div>
  )
}
