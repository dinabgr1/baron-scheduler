export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { AircraftSetting } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_auth')
  if (cookie?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await dbAll<AircraftSetting>('SELECT * FROM aircraft_settings')
  return NextResponse.json(settings)
}

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_auth')
  if (cookie?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, value } = await request.json()
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })
  }

  await dbRun(
    `INSERT INTO aircraft_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    key, String(value)
  )

  const updated = await dbFirst<AircraftSetting>('SELECT * FROM aircraft_settings WHERE key = ?', key)
  return NextResponse.json(updated)
}
