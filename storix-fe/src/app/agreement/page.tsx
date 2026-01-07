// src/app/agreement/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function AgreementPage() {
  const router = useRouter()
  const { setMarketingAgree } = useAuthStore()

  const [agreement1, setAgreement1] = useState(false) // 서비스 이용약관
  const [agreement2, setAgreement2] = useState(false) // 개인정보 수집·이용
  const [agreement3, setAgreement3] = useState(false) // 14세 이상

  const allAgreed = agreement1 && agreement2 && agreement3

  const handleAllAgree = () => {
    const newValue = !allAgreed
    setAgreement1(newValue)
    setAgreement2(newValue)
    setAgreement3(newValue)
  }

  const handleNext = () => {
    if (!allAgreed) return

    // ✅ "다음"을 눌렀다는 건 필수 약관 전체 동의 완료라는 의미
    // ✅ 따라서 marketingAgree도 true로 세팅 (termsAgreed와 동일하게 사용)
    setMarketingAgree(true)

    console.log('[agreement] termsAgreed:', true, 'marketingAgree:', true)

    // 온보딩 페이지로 이동
    router.push('/onboarding')
  }

  const link1Class = agreement1
    ? 'ml-[6px] text-[14px] font-medium leading-[140%] underline text-[#FF4093]'
    : 'ml-[6px] text-[14px] font-medium leading-[140%] underline text-[#888787]'

  const link2Class = agreement2
    ? 'ml-[6px] text-[14px] font-medium leading-[140%] underline text-[#FF4093]'
    : 'ml-[6px] text-[14px] font-medium leading-[140%] underline text-[#888787]'

  const link3Class = agreement3
    ? 'ml-[6px] text-[14px] font-medium leading-[140%] text-[#FF4093]'
    : 'ml-[6px] text-[14px] font-medium leading-[140%]  text-[#888787]'

  return (
    <div className="relative h-full flex flex-col">
      <div className="h-[54px]" />

      <div className="px-4 py-2">
        <div className="relative flex items-center justify-center h-10">
          <Link
            href="/login"
            className="absolute left-0 transition-opacity hover:opacity-70"
          >
            <Image
              src="/icons/back.svg"
              alt="뒤로가기"
              width={24}
              height={24}
            />
          </Link>
          <h1 className="text-[16px] font-medium leading-[140%] text-[#100F0F]">
            약관동의
          </h1>
        </div>
      </div>

      <div className="flex-1 px-4">
        <div className="mt-10">
          <h2 className="text-[24px] font-bold leading-[140%] text-black">
            스토릭스 이용을 위해
            <br />
            필수 약관에 동의해주세요.
          </h2>
        </div>

        <div className="mt-8">
          <button onClick={handleAllAgree} className="w-full" type="button">
            <Image
              src={
                allAgreed ? '/login/terms-pink.svg' : '/login/terms-gray.svg'
              }
              alt="전체 동의"
              width={361}
              height={56}
              className="w-full"
            />
          </button>
        </div>

        <div className="mt-5">
          {/* 서비스 이용약관 */}
          <div className="flex items-center px-3 py-4 h-[52px]">
            <button
              type="button"
              onClick={() => setAgreement1(!agreement1)}
              className="flex-shrink-0"
            >
              <Image
                src={
                  agreement1 ? '/icons/check-pink.svg' : '/icons/check-gray.svg'
                }
                alt="체크"
                width={20}
                height={20}
              />
            </button>

            <a
              href="https://truth-gopher-09e.notion.site/STORIX-2cae81f7094880c889bfd8300787572a?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className={link1Class}
            >
              (필수) 서비스 이용약관 동의
            </a>
          </div>

          {/* 개인정보 수집·이용 */}
          <div className="flex items-center px-3 py-4 h-[52px]">
            <button
              type="button"
              onClick={() => setAgreement2(!agreement2)}
              className="flex-shrink-0"
            >
              <Image
                src={
                  agreement2 ? '/icons/check-pink.svg' : '/icons/check-gray.svg'
                }
                alt="체크"
                width={20}
                height={20}
              />
            </button>

            <a
              href="https://truth-gopher-09e.notion.site/STORIX-2cae81f709488090a7a3ff51191afd9a"
              target="_blank"
              rel="noopener noreferrer"
              className={link2Class}
            >
              (필수) 개인정보 수집·이용 동의
            </a>
          </div>

          {/* 14세 이상 */}
          <div className="flex items-center px-3 py-4 h-[52px]">
            <button
              type="button"
              onClick={() => setAgreement3(!agreement3)}
              className="flex-shrink-0"
            >
              <Image
                src={
                  agreement3 ? '/icons/check-pink.svg' : '/icons/check-gray.svg'
                }
                alt="체크"
                width={20}
                height={20}
              />
            </button>

            <span className={link3Class}>(필수) 14세 이상입니다</span>
          </div>
        </div>
      </div>

      <div className="h-[84px] flex items-center justify-center px-4">
        {allAgreed ? (
          <button
            type="button"
            onClick={handleNext}
            className="w-full transition-opacity hover:opacity-90"
          >
            <Image
              src="/onboarding/next.svg"
              alt="다음"
              width={361}
              height={50}
              className="w-full"
            />
          </button>
        ) : (
          <Image
            src="/onboarding/next-gray.svg"
            alt="다음"
            width={361}
            height={50}
            className="w-full opacity-50"
          />
        )}
      </div>
    </div>
  )
}
