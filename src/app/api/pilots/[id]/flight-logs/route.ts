export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbFirst } from '@/lib/db'
import type { FlightLog, Pilot, Booking } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const pilot = await dbFirst<Pilot>('SELECT * FROM pilots WHERE id = ?', id)
  if (!pilot) return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  const bookings = await dbAll<Booking>('SELECT id FROM bookings WHERE pilot_name = ?', pilot.name)
  if (bookings.length === 0) return NextResponse.json([])
  const ids = bookings.map(b => b.id)
  const placeholders = ids.map(() => '?').join(',')
  const data = await dbAll<FlightLog>(`SELECT * FROM flight_logs WHERE booking_id IN (${placeholders}) ORDER BY created_at DESC`, ...ids)
  return NextResponse.json(data)
}
