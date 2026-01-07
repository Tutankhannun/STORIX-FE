import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.KAKAO_CLIENT_ID
  const redirectUri = process.env.KAKAO_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Kakao configuration is missing' },
      { status: 500 },
    )
  }

  // 백엔드가 제시한 양식대로
  const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&prompt=select_account`

  return NextResponse.json({ url: authUrl })
}
