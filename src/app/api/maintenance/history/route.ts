export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { MaintenanceHistory } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const recordId = searchParams.get('record_id')

  if (recordId) {
    const history = await dbAll<MaintenanceHistory>(
      'SELECT * FROM maintenance_history WHERE maintenance_record_id = ? ORDER BY done_date DESC',
      recordId
    )
    return NextResponse.json(history)
  }

  const history = await dbAll<MaintenanceHistory>('SELECT * FROM maintenance_history ORDER BY done_date DESC')
  return NextResponse.json(history)
}

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_auth')
  if (cookie?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { maintenance_record_id, done_date, done_airframe_hours, hobbs_reading, notes } = await request.json()
  if (!maintenance_record_id || !done_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await dbRun(
    `INSERT INTO maintenance_history (id, maintenance_record_id, done_date, done_airframe_hours, hobbs_reading, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id, maintenance_record_id, done_date,
    done_airframe_hours || null, hobbs_reading || null, notes || null
  )

  // Update parent maintenance_record
  await dbRun(
    `UPDATE maintenance_records SET
       last_done_date = ?,
       last_done_airframe_hours = ?,
       hobbs_at_maintenance = ?,
       last_done_hobbs = COALESCE(?, last_done_hobbs),
       updated_at = datetime('now')
     WHERE id = ?`,
    done_date,
    done_airframe_hours || null,
    hobbs_reading || null,
    hobbs_reading || null,
    maintenance_record_id
  )

  const entry = await dbFirst<MaintenanceHistory>('SELECT * FROM maintenance_history WHERE id = ?', id)
  return NextResponse.json(entry, { status: 201 })
}
