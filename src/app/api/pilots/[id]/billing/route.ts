export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { BillingRecord, Pilot } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const pilot = await dbFirst<Pilot>('SELECT * FROM pilots WHERE id = ?', id)
  if (!pilot) return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  const data = await dbAll<BillingRecord>('SELECT * FROM billing_records WHERE pilot_name = ? ORDER BY created_at DESC', pilot.name)
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pilotId } = await params
  const pilot = await dbFirst<Pilot>('SELECT * FROM pilots WHERE id = ?', pilotId)
  if (!pilot) return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })

  const body = await request.json()
  const { booking_id, flight_date, hours_flown, rate_per_hour, total_amount, payment_method, package_id, notes } = body

  const id = crypto.randomUUID()
  await dbRun(
    `INSERT INTO billing_records (id, booking_id, pilot_name, flight_date, hours_flown, rate_per_hour, total_amount, payment_method, package_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, booking_id || null, pilot.name, flight_date || null, hours_flown || null,
    rate_per_hour || null, total_amount || null, payment_method || 'hour-bank',
    package_id || null, notes || null
  )
  const data = await dbFirst<BillingRecord>('SELECT * FROM billing_records WHERE id = ?', id)
  return NextResponse.json(data, { status: 201 })
}
