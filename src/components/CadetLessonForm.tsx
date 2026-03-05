'use client'

import { useState } from 'react'
import { BRIEFINGS, FLIGHT_LESSONS, GRADE_OPTIONS, STATUS_OPTIONS } from '@/lib/cadet-curriculum'

interface CadetLessonFormProps {
  pilotName: string
  bookingId: string
  flightLogId: string
  onComplete: () => void
}

export default function CadetLessonForm({ pilotName, bookingId, flightLogId, onComplete }: CadetLessonFormProps) {
  const [lessonType, setLessonType] = useState<'briefing' | 'flight'>('flight')
  const [lessonNumber, setLessonNumber] = useState(1)
  const [isRepeat, setIsRepeat] = useState(false)
  const [lessonStatus, setLessonStatus] = useState('U')
  const [instructorName, setInstructorName] = useState('שני שגיב')
  const [instructorLicense, setInstructorLicense] = useState('936')
  const [notes, setNotes] = useState('')
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const lessons = lessonType === 'briefing' ? BRIEFINGS : FLIGHT_LESSONS
  const selectedLesson = lessons.find(l => l.number === lessonNumber) || lessons[0]

  function setGrade(exercise: string, grade: string) {
    setGrades(prev => ({ ...prev, [exercise]: grade }))
  }

  async function handleSave() {
    setSubmitting(true)
    setError('')
    try {
      const exercises = selectedLesson.exercises.map(ex => ({
        exercise_name: ex,
        grade: grades[ex] || '3',
      }))
      const res = await fetch('/api/cadet-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pilot_name: pilotName,
          booking_id: bookingId,
          flight_log_id: flightLogId,
          lesson_type: lessonType,
          lesson_number: selectedLesson.number,
          lesson_attempt: isRepeat ? 2 : 1,
          lesson_status: lessonStatus,
          instructor_name: instructorName,
          instructor_license: instructorLicense,
          notes,
          submitted_by: 'cadet',
          exercises,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'שגיאה בשמירה')
      }
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בשמירה')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 py-2" dir="rtl">
      <div className="text-center">
        <div className="text-2xl mb-1">📋</div>
        <h3 className="text-gray-900 font-bold text-lg">מילוי תיק חניך</h3>
        <p className="text-gray-500 text-sm">מלא את פרטי השיעור לאחר הטיסה</p>
      </div>

      {/* Lesson type */}
      <div className="flex rounded-xl overflow-hidden border border-gray-300">
        <button
          type="button"
          onClick={() => { setLessonType('flight'); setLessonNumber(1) }}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            lessonType === 'flight' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          ✈️ שיעור טיסה
        </button>
        <button
          type="button"
          onClick={() => { setLessonType('briefing'); setLessonNumber(1) }}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            lessonType === 'briefing' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          📚 תדריך כיתתי
        </button>
      </div>

      {/* Lesson selection */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">בחר שיעור</label>
        <select
          value={lessonNumber}
          onChange={e => setLessonNumber(Number(e.target.value))}
          className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
        >
          {lessons.map(l => (
            <option key={l.number} value={l.number}>
              {lessonType === 'briefing' ? 'תדריך' : 'שיעור'} {l.number} — {l.title}
            </option>
          ))}
        </select>
      </div>

      {/* Repeat lesson (flight only) */}
      {lessonType === 'flight' && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <input
            type="checkbox"
            id="isRepeat"
            checked={isRepeat}
            onChange={e => setIsRepeat(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
          <label htmlFor="isRepeat" className="text-amber-800 text-sm font-medium cursor-pointer">
            חזרה על שיעור שכבר בוצע
          </label>
        </div>
      )}

      {/* Exercises */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-gray-700 text-sm font-medium">תרגילים</label>
          <span className="text-gray-400 text-xs">{selectedLesson.exercises.length} תרגילים</span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {selectedLesson.exercises.map(ex => (
            <div key={ex} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-gray-700 text-xs flex-1">{ex}</span>
              <select
                value={grades[ex] || '3'}
                onChange={e => setGrade(ex, e.target.value)}
                className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-900 text-xs font-medium min-w-[90px] focus:outline-none focus:border-blue-500"
              >
                {GRADE_OPTIONS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Overall status */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">ציון כולל לשיעור</label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setLessonStatus(s.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors border ${
                lessonStatus === s.value
                  ? s.value === 'S' ? 'bg-green-600 text-white border-green-600'
                    : s.value === 'U' ? 'bg-red-600 text-white border-red-600'
                    : 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Instructor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">שם מדריך</label>
          <input
            type="text"
            value={instructorName}
            onChange={e => setInstructorName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">מספר רישיון</label>
          <input
            type="text"
            value={instructorLicense}
            onChange={e => setInstructorLicense(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">הערות (אופציונלי)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="הערות נוספות..."
          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm resize-none"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white font-bold text-sm transition-colors"
        >
          {submitting ? 'שומר...' : 'שמור תיק חניך ✅'}
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-sm transition-colors"
        >
          דלג
        </button>
      </div>
      <p className="text-gray-400 text-xs text-center">לחיצה על &quot;דלג&quot; — המדריך ישלים מאוחר יותר</p>
    </div>
  )
}
