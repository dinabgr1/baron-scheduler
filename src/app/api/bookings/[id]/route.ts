export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbFirst, dbRun } from '@/lib/db'
import type { Booking } from '@/lib/db'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = await dbFirst<Booking>('SELECT * FROM bookings WHERE id = ?', id)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const existing = await dbFirst<Booking>('SELECT * FROM bookings WHERE id = ?', id)
  if (!existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  if (body.status && body.status !== existing.status && existing.google_event_id) {
    try { await updateCalendarEvent(existing.google_event_id, body.status, existing.pilot_name) } catch (e) { console.error('Calendar update error:', e) }
  }

  const fields: string[] = []
  const values: unknown[] = []
  for (const [key, val] of Object.entries(body)) {
    if (key === 'id') continue
    fields.push(`${key} = ?`)
    values.push(val)
  }
  if (fields.length === 0) return NextResponse.json(existing)

  values.push(id)
  await dbRun(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, ...values)
  const data = await dbFirst<Booking>('SELECT * FROM bookings WHERE id = ?', id)
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const existing = await dbFirst<Booking>('SELECT * FROM bookings WHERE id = ?', id)
  if (existing?.google_event_id) {
    try { await deleteCalendarEvent(existing.google_event_id) } catch (e) { console.error('Calendar delete error:', e) }
  }
  await dbRun('DELETE FROM bookings WHERE id = ?', id)
  return NextResponse.json({ success: true })
}
