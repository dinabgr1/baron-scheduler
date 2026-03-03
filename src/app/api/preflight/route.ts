export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'

export const dynamic = 'force-dynamic'

type PreflightChecklist = { id: string; booking_id: string|null; pilot_name: string; checked_items: string; all_passed: number; notes: string|null; created_at: string }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('booking_id')
  if (bookingId) {
    const data = await dbFirst<PreflightChecklist>('SELECT * FROM preflight_checklists WHERE booking_id = ?', bookingId)
    return NextResponse.json(data)
  }
  const data = await dbAll<PreflightChecklist>('SELECT * FROM preflight_checklists ORDER BY created_at DESC')
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { booking_id, pilot_name, checked_items, all_passed, notes } = body
  if (!pilot_name) return NextResponse.json({ error: 'Missing pilot_name' }, { status: 400 })

  const id = crypto.randomUUID()
  await dbRun(
    'INSERT INTO preflight_checklists (id, booking_id, pilot_name, checked_items, all_passed, notes) VALUES (?, ?, ?, ?, ?, ?)',
    id, booking_id || null, pilot_name, JSON.stringify(checked_items || []), all_passed ? 1 : 0, notes || null
  )
  const data = await dbFirst<PreflightChecklist>('SELECT * FROM preflight_checklists WHERE id = ?', id)
  return NextResponse.json(data, { status: 201 })
}
