export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { CadetLessonRecord, CadetLessonExercise } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pilotName = searchParams.get('pilot_name')
  if (!pilotName) return NextResponse.json({ error: 'pilot_name required' }, { status: 400 })

  const records = await dbAll<CadetLessonRecord>(
    'SELECT * FROM cadet_lesson_records WHERE pilot_name = ? ORDER BY created_at DESC',
    pilotName
  )

  // Fetch exercises for each record
  const recordsWithExercises = await Promise.all(
    records.map(async (record) => {
      const exercises = await dbAll<CadetLessonExercise>(
        'SELECT * FROM cadet_lesson_exercises WHERE lesson_record_id = ? ORDER BY created_at',
        record.id
      )
      return { ...record, exercises }
    })
  )

  return NextResponse.json(recordsWithExercises)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    pilot_name, booking_id, flight_log_id, lesson_type, lesson_number,
    lesson_attempt, lesson_status, instructor_name, instructor_license,
    notes, submitted_by, exercises
  } = body

  if (!pilot_name || !lesson_type || !lesson_number) {
    return NextResponse.json({ error: 'pilot_name, lesson_type, lesson_number required' }, { status: 400 })
  }
  if (!['briefing', 'flight'].includes(lesson_type)) {
    return NextResponse.json({ error: 'Invalid lesson_type' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await dbRun(
    `INSERT INTO cadet_lesson_records
      (id, pilot_name, booking_id, flight_log_id, lesson_type, lesson_number, lesson_attempt,
       lesson_status, instructor_name, instructor_license, notes, submitted_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, pilot_name, booking_id || null, flight_log_id || null, lesson_type, lesson_number,
    lesson_attempt || 1, lesson_status || 'U', instructor_name || null, instructor_license || null,
    notes || null, submitted_by || 'cadet'
  )

  // Insert exercises
  if (Array.isArray(exercises)) {
    for (const ex of exercises) {
      const exId = crypto.randomUUID()
      await dbRun(
        'INSERT INTO cadet_lesson_exercises (id, lesson_record_id, exercise_name, grade) VALUES (?, ?, ?, ?)',
        exId, id, ex.exercise_name, ex.grade
      )
    }
  }

  const record = await dbFirst<CadetLessonRecord>('SELECT * FROM cadet_lesson_records WHERE id = ?', id)
  return NextResponse.json(record, { status: 201 })
}
