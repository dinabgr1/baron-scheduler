export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { Pilot } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await dbAll<Pilot>('SELECT * FROM pilots WHERE is_active = 1 ORDER BY name')
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, phone, email, license_number } = body
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const id = crypto.randomUUID()
  await dbRun(
    'INSERT INTO pilots (id, name, phone, email, license_number) VALUES (?, ?, ?, ?, ?)',
    id, name, phone || null, email || null, license_number || null
  )
  const data = await dbFirst<Pilot>('SELECT * FROM pilots WHERE id = ?', id)
  return NextResponse.json(data, { status: 201 })
}
