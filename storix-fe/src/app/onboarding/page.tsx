// src/app/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useSignup } from '@/hooks/auth/useSignup'
import Topbar from './components/topbar'
import Nickname from './components/nickname'
import Gender from './components/gender'
import Genre from './components/genre'
import type { GenreKey } from './components/genre'

import Favorite from './components/favorite'
import Final from './components/final'

export default function OnboardingPage() {
  console.log('onboardingToken now:', useAuthStore.getState().onboardingToken) // 디버깅
  const router = useRouter()
  const { marketingAgree, onboardingToken } = useAuthStore()
  const { mutate: signupMutate, isPending } = useSignup()

  const [step, setStep] = useState(1)
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('')
  const [genres, setGenres] = useState<GenreKey[]>([])
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])

  // ✅ 1단계(닉네임)에서만 쓰는 "다음으로" 활성화 상태
  const [canGoNextNickname, setCanGoNextNickname] = useState(false)

  // 각 단계별 유효성 검사
  const isStepValid = () => {
    switch (step) {
      case 1:
        // ✅ "닉네임 사용 가능(중복체크 통과)"일 때만 다음 가능
        return canGoNextNickname
      case 2:
        return gender !== ''
      case 3:
        return genres.length >= 1
      case 4:
        return favoriteIds.length >= 1
      case 5:
        return true
      default:
        return false
    }
  }

  const canProceed = isStepValid()

  const handleNext = () => {
    if (!canProceed) return

    if (step < 5) {
      setStep(step + 1)
    } else {
      handleSignup()
    }
  }

  const handleSignup = () => {
    if (gender === '') return

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('signup_nickname', nickname)
      sessionStorage.setItem('signup_genres', JSON.stringify(genres))
      sessionStorage.setItem('signup_favoriteIds', JSON.stringify(favoriteIds))
      sessionStorage.setItem('signup_gender', gender)
    }

    signupMutate({
      marketingAgree,
      nickName: nickname,
      gender,
      favoriteGenreList: genres,
      favoriteWorksIdList: favoriteIds,
    })
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.push('/agreement')
    }
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[16px] font-medium text-[var(--color-gray-700)]">
          회원가입 중...
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-white">
      {/* Topbar */}
      <div className="absolute top-[54px] left-0 right-0 z-50">
        <Topbar onBack={handleBack} />
      </div>

      {/* Progress Indicator */}
      {step <= 4 && (
        <div className="absolute top-[110px] left-4 z-40">
          <img
            src={`/onboarding/progress-indicater-${step}.svg`}
            alt={`진행도 ${step}/4`}
            className="h-[8px]"
            style={{ display: 'block' }}
          />
        </div>
      )}

      {/* 컨텐츠 영역 */}
      <div
        className="px-4 h-full overflow-y-auto"
        style={{
          paddingTop: step <= 4 ? '150px' : '110px',
          paddingBottom: '134px',
        }}
      >
        {step === 1 && (
          <Nickname
            value={nickname}
            onChange={setNickname}
            onAvailabilityChange={setCanGoNextNickname}
          />
        )}
        {step === 2 && <Gender value={gender} onChange={setGender} />}
        {step === 3 && <Genre value={genres} onChange={setGenres} />}
        {step === 4 && (
          <Favorite value={favoriteIds} onChange={setFavoriteIds} />
        )}
        {step === 5 && <Final />}
      </div>

      {/* 하단 다음 버튼 */}
      <div className="absolute bottom-[34px] left-1/2 -translate-x-1/2 w-[361px] z-50">
        <img
          src={
            canProceed ? '/onboarding/next.svg' : '/onboarding/next-gray.svg'
          }
          alt="다음"
          className={`w-full h-[50px] ${
            canProceed
              ? 'cursor-pointer hover:opacity-80 transition-opacity'
              : 'cursor-not-allowed opacity-50'
          }`}
          onClick={handleNext}
        />
      </div>
    </div>
  )
}
