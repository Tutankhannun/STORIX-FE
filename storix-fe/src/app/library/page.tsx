// src/app/library/page.tsx
'use client'

import LibraryHeader from '@/components/library/LibraryHeader'
import NavBar from '@/components/common/NavBar'
import MyTypeCard from '@/components/home/myType/MyTypeCard'

export default function Library() {
  return (
    <div className="px-4">
      <LibraryHeader />
      <div className="w-full h-full flex flex-col pb-32">
        <div className="flex-1 flex flex-col gap-[24px] overflow-y-auto overflow-x-hidden">
          <div className="w-[390px] mx-auto"> </div>
        </div>
      </div>
      <NavBar active={'library'} />
    </div>
  )
}
