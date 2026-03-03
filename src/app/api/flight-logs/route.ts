export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { FlightLog } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await dbAll<FlightLog>('SELECT * FROM flight_logs ORDER BY created_at DESC')
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { booking_id, hobbs_start, hobbs_end, flight_time_hours, flight_time_minutes, fuel_added_liters, fuel_level_quarters, oil_engine1, oil_engine2, notes } = body

  if (!booking_id || hobbs_start === undefined || hobbs_end === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await dbRun(
    `INSERT INTO flight_logs (id, booking_id, hobbs_start, hobbs_end, flight_time_hours, flight_time_minutes, fuel_added_liters, fuel_level_quarters, oil_engine1, oil_engine2, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, booking_id, hobbs_start, hobbs_end,
    flight_time_hours || 0, flight_time_minutes || 0,
    fuel_added_liters || 0, fuel_level_quarters || 4,
    oil_engine1 || 0, oil_engine2 || 0, notes || null
  )
  const data = await dbFirst<FlightLog>('SELECT * FROM flight_logs WHERE id = ?', id)
  return NextResponse.json(data, { status: 201 })
}
