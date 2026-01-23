// src/app/profile/fix/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nickname from './components/nickname'
import Bio from './components/bio'
import {
  updateProfileNickname,
  updateProfileDescription,
  updateProfileImage,
} from '@/api/profile/profile.api'
import { useProfileStore } from '@/store/profile.store'
import {
  createProfileImagePresignedPutUrl,
  type ImageContentType,
} from '@/api/image/image.api'

export default function ProfileFixPage() {
  const router = useRouter()

  const [nickname, setNickname] = useState('')
  const [initialNickname, setInitialNickname] = useState('')
  const [nicknameVerified, setNicknameVerified] = useState(false) // ✅ 중복확인(검증) 완료 여부

  const [bioText, setBioText] = useState('')
  const [initialBioText, setInitialBioText] = useState('')

  const me = useProfileStore((s) => s.me)
  const patchMe = useProfileStore((s) => s.patchMe)

  // ✅ 프로필 이미지: "선택 시 미리보기만" 반영하고, 실제 저장은 완료 버튼에서
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [initialProfileImageUrl, setInitialProfileImageUrl] = useState<
    string | undefined
  >(undefined)

  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ✅ 입력이 자꾸 지워지는 것 방지: me로 초기값 세팅은 1회만
  const initedRef = useRef(false)

  useEffect(() => {
    if (!me) return
    if (initedRef.current) return
    initedRef.current = true

    const nextNickname = me.nickName ?? ''
    const nextBio = me.profileDescription ?? ''
    const nextProfileImageUrl = me.profileImageUrl ?? undefined

    setNickname(nextNickname)
    setInitialNickname(nextNickname)

    setBioText(nextBio)
    setInitialBioText(nextBio)

    setInitialProfileImageUrl(nextProfileImageUrl)

    setPreviewUrl(undefined)
    setSelectedImageFile(null)

    // ✅ 초기 진입 시에는 “기존 닉네임”도 검증 안 된 상태로 시작
    // (중복확인 눌러야 완료 활성화)
    setNicknameVerified(false)

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('profile_bio', nextBio)
    }
  }, [me])

  // 기존 Bio 컴포넌트가 sessionStorage를 읽는 구조라면 유지
  useEffect(() => {
    if (typeof window === 'undefined') return

    const id = window.setInterval(() => {
      const nextBio = sessionStorage.getItem('profile_bio') || ''
      setBioText(nextBio)
    }, 200)

    return () => window.clearInterval(id)
  }, [])

  // ✅ 언마운트 시 objectURL 정리
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const nicknameChanged = nickname !== initialNickname
  const bioChanged = bioText !== initialBioText
  const imageChanged = !!selectedImageFile

  // ✅ 완료 버튼: 기본 비활성화
  // ✅ 닉네임은 "중복확인(검증) 완료" 되어야만 완료 활성화
  // ✅ 닉네임이 빈칸/조건 불만족이면 Nickname 컴포넌트가 verified를 true로 올려주지 못함
  const isEnabled = useMemo(() => {
    // 닉네임이 빈칸이면 무조건 비활성화
    if (!nickname.trim()) return false

    // ✅ 닉네임 중복확인(검증)을 눌러서 OK여야 함
    if (!nicknameVerified) {
      // 단, 닉네임 말고 bio/이미지만 바꾼 경우엔 완료 가능하게 하고 싶다면 주석 해제:
      // if (bioChanged || imageChanged) return true
      return false
    }

    // 여기까지 왔다는 건 "닉네임 검증 완료" 상태
    // 닉네임이든 bio든 이미지든 뭐든 저장 가능
    return nicknameChanged || bioChanged || imageChanged
  }, [nickname, nicknameVerified, nicknameChanged, bioChanged, imageChanged])

  const [isPressed, setIsPressed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const openFilePicker = () => {
    if (isUploadingImage || isSaving) return
    fileInputRef.current?.click()
  }

  const toContentType = (file: File): ImageContentType | null => {
    if (file.type === 'image/jpeg') return 'image/jpeg'
    if (file.type === 'image/png') return 'image/png'
    if (file.type === 'image/webp') return 'image/webp'
    return null
  }

  const handleSelectProfileImage = (file: File) => {
    const contentType = toContentType(file)
    if (!contentType) {
      window.alert('업로드 가능한 이미지 형식은 JPG/PNG/WEBP 입니다.')
      return
    }

    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    const nextPreview = URL.createObjectURL(file)
    setPreviewUrl(nextPreview)

    setSelectedImageFile(file)
  }

  const uploadAndApplyProfileImage = async (file: File) => {
    const contentType = toContentType(file)
    if (!contentType) {
      throw new Error('업로드 가능한 이미지 형식은 JPG/PNG/WEBP 입니다.')
    }

    setIsUploadingImage(true)
    try {
      const presignRes = await createProfileImagePresignedPutUrl(contentType)
      if (!presignRes.isSuccess) {
        throw new Error(presignRes.message || 'Presigned URL 발급 실패')
      }

      const { url: presignedPutUrl, objectKey } = presignRes.result

      const putRes = await fetch(presignedPutUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      })

      if (!putRes.ok) {
        const t = await putRes.text().catch(() => '')
        throw new Error(`이미지 업로드 실패: ${putRes.status} ${t}`)
      }

      const applyRes = await updateProfileImage(objectKey)
      if (!applyRes.isSuccess) {
        throw new Error(applyRes.message || '프로필 이미지 변경 실패')
      }

      patchMe({ profileImageUrl: me?.profileImageUrl || undefined })
      return { objectKey }
    } finally {
      setIsUploadingImage(false)
    }
  }

  const onSubmit = async () => {
    if (!isEnabled || isSaving) return

    setIsPressed(true)
    setIsSaving(true)

    try {
      // 1) 닉네임 변경
      if (nicknameChanged) {
        const res = await updateProfileNickname(nickname)
        if (!res.isSuccess) throw new Error(res.message || '닉네임 변경 실패')
        patchMe({ nickName: nickname })
      }

      // 2) 한 줄 소개 변경
      if (bioChanged) {
        const res = await updateProfileDescription(bioText)
        if (!res.isSuccess)
          throw new Error(res.message || '한 줄 소개 변경 실패')
        patchMe({ profileDescription: bioText })
      }

      // 3) 프로필 이미지 변경
      if (selectedImageFile) {
        await uploadAndApplyProfileImage(selectedImageFile)

        setSelectedImageFile(null)
        setInitialProfileImageUrl(me?.profileImageUrl ?? undefined)
      }

      window.alert('프로필 수정 완료')
      router.replace('/profile')
    } catch (e: any) {
      console.error('[profile-fix] submit error:', e)
      window.alert(e?.message ?? '프로필 수정 중 오류가 발생했어요.')
      setIsPressed(false)

      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(undefined)
      setSelectedImageFile(null)
      patchMe({ profileImageUrl: initialProfileImageUrl })
    } finally {
      setIsSaving(false)
    }
  }

  const currentProfileImage =
    previewUrl || (me?.profileImageUrl ? me.profileImageUrl : undefined)

  return (
    <div>
      <div className="flex items-center justify-between p-4">
        <Link href="/profile" className="transition-opacity hover:opacity-70">
          <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
        </Link>

        <h1
          className="absolute left-1/2 -translate-x-1/2 text-[16px] font-medium leading-[140%]"
          style={{ color: 'var(--color-gray-900)' }}
        >
          프로필 수정
        </h1>

        <button
          type="button"
          disabled={!isEnabled || isSaving}
          onClick={onSubmit}
          className={[
            'text-[16px] font-medium leading-[140%] transition-colors',
            isEnabled && !isSaving
              ? 'cursor-pointer hover:opacity-80'
              : 'cursor-default',
          ].join(' ')}
          style={{
            color:
              isEnabled && !isSaving
                ? 'var(--color-magenta-300)'
                : 'var(--color-gray-500)',
          }}
        >
          {isSaving ? '저장 중' : '완료'}
        </button>
      </div>

      {/* ✅ 프로필 이미지 영역 (100x100 + 테두리) */}
      <div className="mt-8 flex justify-center">
        <div className="relative h-[100px] w-[100px]">
          <div className="h-[100px] w-[100px] overflow-hidden rounded-full border border-[var(--color-gray-200)] bg-white">
            <Image
              src={currentProfileImage || '/profile/profile-default.svg'}
              alt="프로필 이미지"
              width={100}
              height={100}
              className="h-full w-full object-cover"
            />
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            disabled={isUploadingImage || isSaving}
            className="absolute bottom-0 right-0 z-10 h-[32px] w-[32px] cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-60"
            aria-label="프로필 이미지 변경"
          >
            <Image
              src="/profile/profile-change.svg"
              alt="프로필 이미지 변경"
              width={32}
              height={32}
              priority
            />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.currentTarget.value = ''
              if (!file) return
              handleSelectProfileImage(file)
            }}
          />

          {isUploadingImage && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/30">
              <span className="text-[12px] font-medium text-white">
                업로드 중…
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 px-4">
        <div
          className="body-2"
          style={{
            color: 'var(--color-gray-500)',
            fontFamily: 'Pretendard',
          }}
        >
          닉네임
        </div>

        <div className="h-3" />

        <Nickname
          value={nickname}
          onChange={(v) => {
            if (isPressed) setIsPressed(false)
            setNickname(v)
            setNicknameVerified(false) // ✅ 입력 바꾸면 다시 중복확인 필요
          }}
          variant="inline"
          currentNickname={initialNickname}
          onVerifiedChange={setNicknameVerified}
        />

        <div className="mt-10">
          <Bio />
        </div>
      </div>
    </div>
  )
}
