export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { Booking } from '@/lib/db'
import { createCalendarEvent } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pilotName = searchParams.get('pilot_name')
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let sql = 'SELECT * FROM bookings WHERE 1=1'
  const params: unknown[] = []

  if (pilotName) { sql += ' AND pilot_name LIKE ?'; params.push(`%${pilotName}%`) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (from) { sql += ' AND date >= ?'; params.push(from) }
  if (to) { sql += ' AND date <= ?'; params.push(to) }

  sql += ' ORDER BY date ASC, start_time ASC'

  const data = await dbAll<Booking>(sql, ...params)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { pilot_name, date, start_time, end_time, with_instructor, instructor_name, phone, flight_purpose } = body

  if (!pilot_name || !date || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check for booking conflicts
  const existing = await dbAll<Booking>(
    'SELECT * FROM bookings WHERE date = ? AND status IN (?, ?)',
    date, 'approved', 'pending'
  )

  if (existing.length > 0) {
    const hasConflict = existing.some(b => start_time < b.end_time && end_time > b.start_time)
    if (hasConflict) {
      return NextResponse.json({ error: 'המטוס תפוס בשעות אלה' }, { status: 409 })
    }
  }

  // Create Google Calendar event
  let googleEventId: string | null = null
  try {
    googleEventId = await createCalendarEvent({
      pilotName: pilot_name,
      date, startTime: start_time, endTime: end_time,
      withInstructor: with_instructor, instructorName: instructor_name,
    }) || null
  } catch (error) {
    console.error('Google Calendar error:', error)
  }

  const id = crypto.randomUUID()
  await dbRun(
    `INSERT INTO bookings (id, pilot_name, date, start_time, end_time, with_instructor, instructor_name, status, google_event_id, phone, flight_purpose)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    id, pilot_name, date, start_time, end_time, with_instructor ? 1 : 0,
    with_instructor ? (instructor_name || 'Shani Segev') : null,
    googleEventId, phone || null, flight_purpose || 'אימון'
  )

  const data = await dbFirst<Booking>('SELECT * FROM bookings WHERE id = ?', id)
  return NextResponse.json(data, { status: 201 })
}
