export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll } from '@/lib/db'

export const dynamic = 'force-dynamic'

type LoginLog = {
  id: string
  login_type: string
  user_name: string | null
  ip: string
  user_agent: string
  success: number
  created_at: string
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_auth')
  if (cookie?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') || 100), 500)

  const logs = await dbAll<LoginLog>(
    'SELECT * FROM login_logs ORDER BY created_at DESC LIMIT ?',
    limit
  )
  return NextResponse.json(logs)
}
