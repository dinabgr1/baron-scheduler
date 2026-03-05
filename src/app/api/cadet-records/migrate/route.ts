export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbRun, getEnv } from '@/lib/db'

export const dynamic = 'force-dynamic'

// One-time migration endpoint — call once after deploy
// Protected by admin password
export async function POST(request: NextRequest) {
  const body = await request.json()
  const env = getEnv()
  const adminPassword = env.ADMIN_PASSWORD || 'BaronAdmin'
  if (body.password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  // 1. Add twin_engine_status to pilots (will fail silently if already exists)
  try {
    await dbRun("ALTER TABLE pilots ADD COLUMN twin_engine_status TEXT DEFAULT 'none'")
    results.push('Added twin_engine_status to pilots')
  } catch {
    results.push('twin_engine_status already exists (skipped)')
  }

  // 2. Create cadet_lesson_records
  try {
    await dbRun(`CREATE TABLE IF NOT EXISTS cadet_lesson_records (
      id TEXT PRIMARY KEY,
      pilot_name TEXT NOT NULL,
      booking_id TEXT,
      flight_log_id TEXT,
      lesson_type TEXT NOT NULL,
      lesson_number INTEGER NOT NULL,
      lesson_attempt INTEGER DEFAULT 1,
      lesson_status TEXT DEFAULT 'U',
      instructor_name TEXT,
      instructor_license TEXT,
      notes TEXT,
      submitted_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`)
    results.push('Created cadet_lesson_records table')
  } catch (e) {
    results.push(`cadet_lesson_records error: ${e}`)
  }

  // 3. Create cadet_lesson_exercises
  try {
    await dbRun(`CREATE TABLE IF NOT EXISTS cadet_lesson_exercises (
      id TEXT PRIMARY KEY,
      lesson_record_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    results.push('Created cadet_lesson_exercises table')
  } catch (e) {
    results.push(`cadet_lesson_exercises error: ${e}`)
  }

  return NextResponse.json({ success: true, results })
}
