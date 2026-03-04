export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { MaintenanceRecord, FlightLog, AircraftSetting } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getAirframeHours(): Promise<number> {
  const setting = await dbFirst<AircraftSetting>(
    "SELECT value FROM aircraft_settings WHERE key = 'airframe_hours_initial'"
  )
  const initial = parseFloat(setting?.value || '0')

  const result = await dbFirst<{ total: number }>(
    'SELECT COALESCE(SUM(flight_time_hours + flight_time_minutes / 60.0), 0) as total FROM flight_logs'
  )
  return initial + (result?.total || 0)
}

export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url)
  const pilotsOnly = searchParams.get('pilots_only')

  let sql = 'SELECT * FROM maintenance_records'
  if (pilotsOnly) sql += ' WHERE visible_to_pilots = 1'
  sql += ' ORDER BY created_at'

  const records = await dbAll<MaintenanceRecord>(sql)

  // Get current Hobbs from latest flight log
  const lastLog = await dbFirst<FlightLog>('SELECT hobbs_end FROM flight_logs WHERE hobbs_end IS NOT NULL ORDER BY hobbs_end DESC LIMIT 1')
  const currentHobbs = lastLog?.hobbs_end || 0

  const totalAirframeHours = await getAirframeHours()

  // Calculate remaining for each record
  const enriched = records.map(rec => {
    const intervalType = rec.interval_type || (rec.interval_months && rec.interval_months > 0 ? 'calendar' : 'airtime')
    let remaining: number | null = null
    let remainingUnit: 'hours' | 'days' = 'hours'
    let percentage = 0

    if (intervalType === 'calendar' && rec.last_done_date && rec.interval_months) {
      const lastDone = new Date(rec.last_done_date)
      const nextDue = new Date(lastDone)
      nextDue.setMonth(nextDue.getMonth() + rec.interval_months)
      const daysRemaining = Math.round((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      remaining = daysRemaining
      remainingUnit = 'days'
      const totalDays = rec.interval_months * 30.44
      percentage = Math.min(100, Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100))
    } else if (intervalType === 'fixed_airframe' && rec.next_due_airframe_hours) {
      remaining = Math.round((rec.next_due_airframe_hours - totalAirframeHours) * 10) / 10
      remainingUnit = 'hours'
      const lastDoneAF = rec.last_done_airframe_hours || 0
      const interval = rec.next_due_airframe_hours - lastDoneAF
      percentage = interval > 0 ? Math.min(100, Math.max(0, ((totalAirframeHours - lastDoneAF) / interval) * 100)) : 0
    } else {
      // airtime: based on hobbs
      const hoursUsed = currentHobbs - (rec.last_done_hobbs || 0)
      remaining = rec.interval_hours ? Math.round((rec.interval_hours - hoursUsed) * 10) / 10 : null
      remainingUnit = 'hours'
      percentage = rec.interval_hours ? Math.min(100, Math.max(0, (hoursUsed / rec.interval_hours) * 100)) : 0
    }

    return {
      ...rec,
      interval_type: intervalType,
      remaining,
      remainingUnit,
      percentage,
    }
  })

  if (pilotsOnly) {
    // Don't return airframe hours to pilots
    return NextResponse.json({ records: enriched, currentHobbs }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    })
  }

  return NextResponse.json({ records: enriched, currentHobbs, totalAirframeHours }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
  })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message, stack: err instanceof Error ? err.stack : undefined }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { maintenance_type, interval_hours, interval_months, last_done_hobbs, last_done_date, notes,
    interval_type, last_done_airframe_hours, next_due_airframe_hours, hobbs_at_maintenance, visible_to_pilots } = body
  if (!maintenance_type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })

  const id = crypto.randomUUID()
  await dbRun(
    `INSERT INTO maintenance_records (id, maintenance_type, interval_hours, interval_months, last_done_hobbs, last_done_date, notes,
       interval_type, last_done_airframe_hours, next_due_airframe_hours, hobbs_at_maintenance, visible_to_pilots)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, maintenance_type,
    interval_hours || null, interval_months || null,
    last_done_hobbs || 0, last_done_date || null, notes || null,
    interval_type || 'airtime',
    last_done_airframe_hours || null, next_due_airframe_hours || null,
    hobbs_at_maintenance || null, visible_to_pilots !== undefined ? (visible_to_pilots ? 1 : 0) : 1
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
  await dbRun('DELETE FROM maintenance_history WHERE maintenance_record_id = ?', id)
  await dbRun('DELETE FROM maintenance_records WHERE id = ?', id)
  return NextResponse.json({ success: true })
}
