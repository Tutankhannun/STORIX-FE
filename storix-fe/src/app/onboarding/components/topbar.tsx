// src/app/onboarding/components/topbar.tsx
'use client'

import { useRouter } from 'next/navigation'

interface TopbarProps {
  onBack: () => void
}

export default function Topbar({ onBack }: TopbarProps) {
  const router = useRouter()

  return (
    <div className="w-full h-14 p-4 flex justify-between items-center bg-white">
      {/* 뒤로가기 */}
      <img
        src="/icons/back.svg"
        alt="뒤로가기"
        width={24}
        height={24}
        className="cursor-pointer brightness-0"
        onClick={onBack}
      />
    </div>
  )
}
