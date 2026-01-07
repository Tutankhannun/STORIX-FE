// src/app/manual/components/topbar.tsx
'use client'

import { useRouter } from 'next/navigation'

interface TopbarProps {
  onBack: () => void
}

export default function Topbar({ onBack }: TopbarProps) {
  const router = useRouter()

  return (
    <div className="w-full h-14 p-4 flex justify-end items-center bg-white">
      {/* 건너뛰기 */}
      <button
        onClick={() => router.push('/home')}
        className="text-center cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap shrink-0"
        style={{
          width: '56px',
          height: '22px',
          color: 'var(--color-gray-500)',
          fontFamily: 'SUIT',
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: '140%',
        }}
      >
        건너뛰기
      </button>
    </div>
  )
}
