export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getEnv, dbRun } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const env = getEnv()
  const success = password === env.ADMIN_PASSWORD

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const language = request.headers.get('accept-language')?.split(',')[0] || null
  const referrer = request.headers.get('referer') || null
  const country = request.headers.get('cf-ipcountry') || null
  const city = request.headers.get('cf-ipcity') || null

  try {
    await dbRun(
      `INSERT INTO login_logs (id, login_type, user_name, ip, user_agent, success, created_at, city, country, referrer, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(), 'admin', null, ip, userAgent, success ? 1 : 0,
      new Date().toISOString(), city, country, referrer, language
    )
  } catch { /* don't block login if logging fails */ }

  if (!success) {
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
