export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'
import type { CadetLessonRecord, CadetLessonExercise } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const record = await dbFirst<CadetLessonRecord>('SELECT * FROM cadet_lesson_records WHERE id = ?', id)
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const exercises = await dbAll<CadetLessonExercise>(
    'SELECT * FROM cadet_lesson_exercises WHERE lesson_record_id = ? ORDER BY created_at',
    id
  )
  return NextResponse.json({ ...record, exercises })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const {
    lesson_status, instructor_name, instructor_license, notes, exercises
  } = body

  await dbRun(
    `UPDATE cadet_lesson_records
     SET lesson_status = ?, instructor_name = ?, instructor_license = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    lesson_status, instructor_name || null, instructor_license || null, notes || null, id
  )

  // Replace exercises if provided
  if (Array.isArray(exercises)) {
    await dbRun('DELETE FROM cadet_lesson_exercises WHERE lesson_record_id = ?', id)
    for (const ex of exercises) {
      const exId = crypto.randomUUID()
      await dbRun(
        'INSERT INTO cadet_lesson_exercises (id, lesson_record_id, exercise_name, grade) VALUES (?, ?, ?, ?)',
        exId, id, ex.exercise_name, ex.grade
      )
    }
  }

  const record = await dbFirst<CadetLessonRecord>('SELECT * FROM cadet_lesson_records WHERE id = ?', id)
  const exRecords = await dbAll<CadetLessonExercise>(
    'SELECT * FROM cadet_lesson_exercises WHERE lesson_record_id = ?', id
  )
  return NextResponse.json({ ...record, exercises: exRecords })
}
