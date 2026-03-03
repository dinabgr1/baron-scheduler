export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { Rate } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await dbAll<Rate>('SELECT * FROM rates WHERE is_active = 1 ORDER BY name')
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, rate_per_hour, description } = body
  if (!name || !rate_per_hour) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const id = crypto.randomUUID()
  await dbRun('INSERT INTO rates (id, name, rate_per_hour, description) VALUES (?, ?, ?, ?)', id, name, rate_per_hour, description || null)
  const data = await dbFirst<Rate>('SELECT * FROM rates WHERE id = ?', id)
  return NextResponse.json(data, { status: 201 })
}
