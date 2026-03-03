export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbRun } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { login_type, user_name, screen_size, timezone, connection } = body

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const language = request.headers.get('accept-language')?.split(',')[0] || null
  const referrer = request.headers.get('referer') || null

  // Cloudflare geo headers
  const country = request.headers.get('cf-ipcountry') || null
  const city = request.headers.get('cf-ipcity') || null

  try {
    await dbRun(
      `INSERT INTO login_logs (id, login_type, user_name, ip, user_agent, success, created_at, city, country, referrer, screen_size, timezone, connection, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(), login_type || 'page', user_name || null, ip, userAgent, 1,
      new Date().toISOString(), city, country, referrer, screen_size || null, timezone || null, connection || null, language
    )
  } catch { /* silent */ }

  return NextResponse.json({ ok: true })
}
