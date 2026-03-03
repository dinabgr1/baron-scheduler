export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { dbAll, dbFirst } from '@/lib/db'
import type { Booking, FlightLog, Pilot, Rate, HourPackage, MaintenanceRecord } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [bookings, flightLogs, pilots, rates, hourPackages, maintenanceRecords, lastLog] = await Promise.all([
    dbAll<Booking>('SELECT * FROM bookings ORDER BY date ASC, start_time ASC'),
    dbAll<FlightLog>('SELECT * FROM flight_logs ORDER BY created_at DESC'),
    dbAll<Pilot>('SELECT * FROM pilots WHERE is_active = 1 ORDER BY name'),
    dbAll<Rate>('SELECT * FROM rates WHERE is_active = 1 ORDER BY name'),
    dbAll<HourPackage>('SELECT * FROM hour_packages ORDER BY purchase_date DESC'),
    dbAll<MaintenanceRecord>('SELECT * FROM maintenance_records ORDER BY created_at'),
    dbFirst<FlightLog>('SELECT hobbs_end FROM flight_logs WHERE hobbs_end IS NOT NULL ORDER BY hobbs_end DESC LIMIT 1'),
  ])

  return NextResponse.json({
    bookings, flightLogs, pilots, rates, hourPackages,
    maintenance: { records: maintenanceRecords, currentHobbs: lastLog?.hobbs_end || 0 },
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
  })
}
