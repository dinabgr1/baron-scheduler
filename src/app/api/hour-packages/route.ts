export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { HourPackage } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await dbAll<HourPackage>('SELECT * FROM hour_packages ORDER BY purchase_date DESC')
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { pilot_id, pilot_name, hours_purchased, price_paid, notes, purchase_date } = body
  if (!pilot_name || !hours_purchased) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const id = crypto.randomUUID()
  await dbRun(
    'INSERT INTO hour_packages (id, pilot_id, pilot_name, hours_purchased, price_paid, purchase_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, pilot_id || null, pilot_name, hours_purchased, price_paid || null, purchase_date || new Date().toISOString().split('T')[0], notes || null
  )
  const data = await dbFirst<HourPackage>('SELECT * FROM hour_packages WHERE id = ?', id)
  return NextResponse.json(data, { status: 201 })
}
