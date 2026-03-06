'use client'
export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { BRIEFINGS, FLIGHT_LESSONS } from '@/lib/cadet-curriculum'

type LessonRecord = {
  id: string
  lesson_type: string
  lesson_number: number
  lesson_attempt: number
  lesson_status: string
  instructor_name: string | null
  notes: string | null
  created_at: string
  exercises: { exercise_name: string; grade: string }[]
}

type FlightLog = {
  id: string
  booking_id: string
  hobbs_start: number
  hobbs_end: number
}

export default function CadetPage() {
  const params = useParams()
  const name = decodeURIComponent(params.name as string)

  const [records, setRecords] = useState<LessonRecord[]>([])
  const [flightLogs, setFlightLogs] = useState<FlightLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [recRes, logsRes] = await Promise.all([
        fetch(`/api/cadet-records?pilot_name=${encodeURIComponent(name)}`),
        fetch(`/api/pilots/check-status?name=${encodeURIComponent(name)}`),
      ])
      const recData = await recRes.json()
      if (Array.isArray(recData)) setRecords(recData)

      // Fetch flight logs by pilot name via bookings
      try {
        const bookingsRes = await fetch(`/api/bookings?pilot_name=${encodeURIComponent(name)}`)
        const bookings = await bookingsRes.json()
        if (Array.isArray(bookings) && bookings.length > 0) {
          const logsPromises = bookings.map((b: { id: string }) =>
            fetch(`/api/flight-logs?booking_id=${b.id}`).then(r => r.json())
          )
          const allLogs = await Promise.all(logsPromises)
          setFlightLogs(allLogs.flat().filter(Boolean))
        }
      } catch { /* ignore */ }

      setLoading(false)
    }
    load()
  }, [name])

  const briefingRecords = records.filter(r => r.lesson_type === 'briefing')
  const flightRecords = records.filter(r => r.lesson_type === 'flight')

  const completedBriefings = new Set(
    briefingRecords.filter(r => r.lesson_status === 'S').map(r => r.lesson_number)
  )
  const completedFlights = new Set(
    flightRecords.filter(r => r.lesson_status === 'S').map(r => r.lesson_number)
  )

  const totalFlightHours = flightLogs.reduce((sum, log) => {
    return sum + (log.hobbs_end - log.hobbs_start)
  }, 0)

  const briefingHoursCompleted = BRIEFINGS
    .filter(b => completedBriefings.has(b.number))
    .reduce((sum, b) => sum + b.durationHours, 0)

  const totalBriefingHours = BRIEFINGS.reduce((sum, b) => sum + b.durationHours, 0)

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      S: 'bg-green-100 text-green-700',
      U: 'bg-red-100 text-red-700',
      I: 'bg-amber-100 text-amber-700',
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  function formatDate(d: string) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('he-IL')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-baron-bg">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center text-baron-muted">טוען תיק חניך...</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-baron-bg" dir="rtl">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-4 pb-32 md:pb-6 space-y-4 pt-[72px]">

        {/* Header */}
        <div className="card rounded-xl p-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-baron-muted uppercase tracking-wide mb-1">תיק חניך דיגיטלי</div>
              <h1 className="text-2xl font-black text-baron-text">{name}</h1>
              <div className="text-baron-muted text-sm mt-0.5">הגדר אווירון קבוצה ב&apos; — Baron 58</div>
            </div>
            <Link
              href={`/cadet/${encodeURIComponent(name)}/pdf`}
              target="_blank"
              className="px-4 py-2 rounded-lg gold-bg text-white font-medium text-sm"
            >
              📄 ייצוא PDF
            </Link>
          </div>
        </div>

        {/* Progress dashboard */}
        <div className="card rounded-xl p-5">
          <h2 className="text-gray-900 font-bold text-base mb-3">לוח התקדמות</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-baron-bg rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-gray-900">{completedBriefings.size}/4</div>
              <div className="text-xs text-gray-500 mt-0.5">📚 תדריכים הושלמו</div>
            </div>
            <div className="bg-baron-bg rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-gray-900">{completedFlights.size}/8</div>
              <div className="text-xs text-gray-500 mt-0.5">✈️ שיעורי טיסה הושלמו</div>
            </div>
            <div className="bg-baron-bg rounded-lg p-3 text-center">
              <div className={`text-2xl font-black ${totalFlightHours >= 10 ? 'text-green-600' : 'text-gray-900'}`}>
                {Math.round(totalFlightHours * 10) / 10}/10
              </div>
              <div className="text-xs text-gray-500 mt-0.5">⏱️ שעות טיסה</div>
            </div>
            <div className="bg-baron-bg rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-gray-900">
                {Math.round(briefingHoursCompleted * 10) / 10}/{totalBriefingHours}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">🕐 שעות תדריך</div>
            </div>
          </div>

          {/* Progress bars */}
          <div className="mt-4 space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>תדריכים</span>
                <span>{Math.round((completedBriefings.size / 4) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(completedBriefings.size / 4) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>שיעורי טיסה</span>
                <span>{Math.round((completedFlights.size / 8) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full transition-all"
                  style={{ width: `${(completedFlights.size / 8) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>שעות טיסה</span>
                <span>{Math.round((Math.min(totalFlightHours, 10) / 10) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-amber-500 rounded-full transition-all"
                  style={{ width: `${Math.min((totalFlightHours / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Briefings */}
        <div className="card rounded-xl p-5">
          <h2 className="text-gray-900 font-bold text-base mb-3">📚 תדריכים כיתתיים</h2>
          <div className="space-y-3">
            {BRIEFINGS.map(lesson => {
              const rec = briefingRecords
                .filter(r => r.lesson_number === lesson.number)
                .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
              return (
                <div key={lesson.number} className="flex items-start gap-3 p-3 rounded-lg bg-baron-bg border border-baron-border">
                  <div className={`text-lg font-black min-w-[28px] text-center ${completedBriefings.has(lesson.number) ? 'text-green-600' : 'text-gray-300'}`}>
                    {completedBriefings.has(lesson.number) ? '✓' : lesson.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-gray-900 text-sm font-medium">{lesson.title}</div>
                      {rec ? (
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${statusBadge(rec.lesson_status)}`}>
                          {rec.lesson_status}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">לא הושלם</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">{lesson.durationHours} שעות</div>
                    {rec && (
                      <div className="text-gray-400 text-xs mt-0.5">
                        {formatDate(rec.created_at)}
                        {rec.instructor_name && ` | ${rec.instructor_name}`}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Flight lessons */}
        <div className="card rounded-xl p-5">
          <h2 className="text-gray-900 font-bold text-base mb-3">✈️ שיעורי טיסה</h2>
          <div className="space-y-3">
            {FLIGHT_LESSONS.map(lesson => {
              const lessonRecs = flightRecords
                .filter(r => r.lesson_number === lesson.number)
                .sort((a, b) => a.created_at.localeCompare(b.created_at))
              const passed = completedFlights.has(lesson.number)
              return (
                <div key={lesson.number} className="p-3 rounded-lg bg-baron-bg border border-baron-border">
                  <div className="flex items-start gap-3">
                    <div className={`text-lg font-black min-w-[28px] text-center ${passed ? 'text-green-600' : 'text-gray-300'}`}>
                      {passed ? '✓' : lesson.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="text-gray-900 text-sm font-medium">{lesson.title}</div>
                        {lessonRecs.length === 0 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">לא הושלם</span>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">{lesson.durationHours} שעות{lesson.instrumentHours ? ` (כולל ${lesson.instrumentHours} מכשירים)` : ''}</div>
                    </div>
                  </div>
                  {lessonRecs.length > 0 && (
                    <div className="mt-2 space-y-1 mr-10">
                      {lessonRecs.map((rec, idx) => (
                        <div key={rec.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-gray-500">
                            ניסיון {idx + 1} — {formatDate(rec.created_at)}
                            {rec.instructor_name && ` | ${rec.instructor_name}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold ${statusBadge(rec.lesson_status)}`}>
                            {rec.lesson_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </main>
    </div>
  )
}
