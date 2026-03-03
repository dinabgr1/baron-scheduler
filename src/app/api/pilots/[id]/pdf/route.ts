export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbFirst, dbAll } from '@/lib/db'
import type { Pilot, Booking, FlightLog, HourPackage, BillingRecord } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const pilot = await dbFirst<Pilot>('SELECT * FROM pilots WHERE id = ?', id)
  if (!pilot) return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })

  const [bookings, hourPackages, billingRecords] = await Promise.all([
    dbAll<Booking>('SELECT * FROM bookings WHERE pilot_name = ? ORDER BY date DESC', pilot.name),
    dbAll<HourPackage>('SELECT * FROM hour_packages WHERE pilot_name = ? ORDER BY purchase_date DESC', pilot.name),
    dbAll<BillingRecord>('SELECT * FROM billing_records WHERE pilot_name = ? ORDER BY created_at DESC', pilot.name),
  ])

  const bookingIds = bookings.map(b => b.id)
  let flightLogs: FlightLog[] = []
  if (bookingIds.length > 0) {
    const placeholders = bookingIds.map(() => '?').join(',')
    flightLogs = await dbAll<FlightLog>(`SELECT * FROM flight_logs WHERE booking_id IN (${placeholders}) ORDER BY created_at DESC`, ...bookingIds)
  }

  return NextResponse.json({ pilot, bookings, flightLogs, hourPackages, billingRecords })
}
