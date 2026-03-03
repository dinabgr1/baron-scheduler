export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbRun } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { login_type, user_name } = await request.json()
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    await dbRun(
      'INSERT INTO login_logs (id, login_type, user_name, ip, user_agent, success, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      crypto.randomUUID(), login_type || 'page', user_name || null, ip, userAgent, 1, new Date().toISOString()
    )
  } catch { /* silent */ }

  return NextResponse.json({ ok: true })
}
