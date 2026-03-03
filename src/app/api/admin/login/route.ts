export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const env = getEnv()
  if (password !== env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_auth', 'true', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}
