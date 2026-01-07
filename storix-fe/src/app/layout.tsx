import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from './providers'
import '@/styles/globals.css'

const suit = localFont({
  src: './fonts/SUIT-Variable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'STORIX',
  icons: {
    icon: '/icons/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${suit.className}`}>
      {/* 화면 전체 배경 */}
      <body className="min-h-dvh overflow-hidden justify-center ">
        <Providers>
          <main className="flex min-h-dvh w-full justify-center text-gray-900 bg-white">
            {/* 가운데 393 x 852 카드 */}
            <div className="iphone16-container flex h-svh w-full max-w-[393px] flex-col bg-white">
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {children}
              </div>
            </div>
          </main>
        </Providers>
      </body>
    </html>
  )
}
