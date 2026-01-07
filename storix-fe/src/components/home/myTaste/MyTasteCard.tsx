// src/components/home/myType/MyTasteCard.tsx
import Image from 'next/image'

export default function MyTasteCard() {
  return (
    <div
      className={`relative flex w-full h-[204px] rounded-2xl bg-gray-100 p-4 overflow-hidden`}
    >
      <Image
        src={'/image/tasteImage.webp'}
        alt="나의 취향 탐색"
        fill
        className="object-cover object-top"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,64,147,0)_27.74%,#FF4093_119.41%)]" />
      <p className="absolute heading-2 bottom-0 text-white pb-4">
        슥 - 넘기기만 해도 취향이 보여요
      </p>
    </div>
  )
}
