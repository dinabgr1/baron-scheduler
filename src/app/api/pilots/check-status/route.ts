export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbFirst } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const pilot = await dbFirst<{ twin_engine_status: string | null }>(
    'SELECT twin_engine_status FROM pilots WHERE name = ? AND is_active = 1 LIMIT 1',
    name
  )

  return NextResponse.json({ twin_engine_status: pilot?.twin_engine_status || 'none' })
}
