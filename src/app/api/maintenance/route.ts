export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { MaintenanceRecord, FlightLog } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pilotsOnly = searchParams.get('pilots_only')

  let sql = 'SELECT * FROM maintenance_records'
  if (pilotsOnly) sql += ' WHERE visible_to_pilots = 1'
  sql += ' ORDER BY created_at'

  const records = await dbAll<MaintenanceRecord>(sql)

  // Get current Hobbs from latest flight log
  const lastLog = await dbFirst<FlightLog>('SELECT hobbs_end FROM flight_logs WHERE hobbs_end IS NOT NULL ORDER BY hobbs_end DESC LIMIT 1')
  const currentHobbs = lastLog?.hobbs_end || 0

  return NextResponse.json({ records, currentHobbs }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { maintenance_type, interval_hours, interval_months, last_done_hobbs, last_done_date, notes } = body
  if (!maintenance_type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })

  const id = crypto.randomUUID()
  await dbRun(
    `INSERT INTO maintenance_records (id, maintenance_type, interval_hours, interval_months, last_done_hobbs, last_done_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, maintenance_type, interval_hours || null, interval_months || null,
    last_done_hobbs || 0, last_done_date || null, notes || null
  )
  const data = await dbFirst<MaintenanceRecord>('SELECT * FROM maintenance_records WHERE id = ?', id)
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const fields: string[] = ['updated_at = datetime(\'now\')']
  const values: unknown[] = []
  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`)
    values.push(val)
  }
  values.push(id)
  await dbRun(`UPDATE maintenance_records SET ${fields.join(', ')} WHERE id = ?`, ...values)
  const data = await dbFirst<MaintenanceRecord>('SELECT * FROM maintenance_records WHERE id = ?', id)
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await dbRun('DELETE FROM maintenance_records WHERE id = ?', id)
  return NextResponse.json({ success: true })
}
