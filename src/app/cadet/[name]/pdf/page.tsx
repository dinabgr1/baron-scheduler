export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { dbAll, dbFirst } from '@/lib/db'
import { BRIEFINGS, FLIGHT_LESSONS, STATUS_OPTIONS, GRADE_OPTIONS } from '@/lib/cadet-curriculum'

type LessonRecord = {
  id: string
  lesson_type: string
  lesson_number: number
  lesson_attempt: number
  lesson_status: string
  instructor_name: string | null
  instructor_license: string | null
  notes: string | null
  created_at: string
}
type Exercise = { exercise_name: string; grade: string }

export default async function CadetPdfPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = await params
  const pilotName = decodeURIComponent(encodedName)

  const records = await dbAll<LessonRecord>(
    'SELECT * FROM cadet_lesson_records WHERE pilot_name = ? ORDER BY lesson_type, lesson_number, created_at',
    pilotName
  )

  const recordsWithEx = await Promise.all(
    records.map(async (r) => {
      const exercises = await dbAll<Exercise>(
        'SELECT exercise_name, grade FROM cadet_lesson_exercises WHERE lesson_record_id = ? ORDER BY created_at',
        r.id
      )
      return { ...r, exercises }
    })
  )

  // Fetch flight logs for hours
  const bookings = await dbAll<{ id: string }>('SELECT id FROM bookings WHERE pilot_name = ?', pilotName)
  let totalFlightHours = 0
  if (bookings.length > 0) {
    for (const b of bookings) {
      const log = await dbFirst<{ hobbs_start: number; hobbs_end: number }>(
        'SELECT hobbs_start, hobbs_end FROM flight_logs WHERE booking_id = ? LIMIT 1', b.id
      )
      if (log && log.hobbs_end > log.hobbs_start) {
        totalFlightHours += log.hobbs_end - log.hobbs_start
      }
    }
  }

  const briefings = recordsWithEx.filter(r => r.lesson_type === 'briefing')
  const flights = recordsWithEx.filter(r => r.lesson_type === 'flight')

  function statusLabel(s: string) {
    return STATUS_OPTIONS.find(o => o.value === s)?.label || s
  }
  function gradeLabel(g: string) {
    return GRADE_OPTIONS.find(o => o.value === g)?.label || g
  }
  function formatDate(d: string) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('he-IL')
  }

  const today = new Date().toLocaleDateString('he-IL')

  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <title>תיק חניך — {pilotName}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: white; direction: rtl; }
          .page { max-width: 800px; margin: 0 auto; padding: 24px; }
          h1 { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
          h2 { font-size: 14px; font-weight: 700; margin: 16px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
          h3 { font-size: 12px; font-weight: 700; margin: 8px 0 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
          th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: right; }
          th { background: #f5f5f5; font-weight: 700; }
          .summary { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
          .summary-box { border: 1px solid #ddd; border-radius: 4px; padding: 8px 12px; min-width: 100px; text-align: center; }
          .summary-box .num { font-size: 22px; font-weight: 900; }
          .summary-box .label { font-size: 10px; color: #666; margin-top: 2px; }
          .status-S { color: #15803d; font-weight: 700; }
          .status-U { color: #dc2626; font-weight: 700; }
          .status-I { color: #d97706; font-weight: 700; }
          .print-btn { position: fixed; top: 16px; left: 16px; padding: 8px 16px; background: #1d4ed8; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; }
          @media print {
            .print-btn { display: none !important; }
            body { font-size: 10px; }
            .page { padding: 12px; }
          }
          .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
          .subtitle { color: #555; font-size: 13px; margin-top: 2px; }
          .meta { color: #777; font-size: 11px; }
          .no-data { color: #999; font-style: italic; }
        `}</style>
      </head>
      <body>
        <button className="print-btn" onClick={() => window.print()}>🖨️ הדפס</button>
        <div className="page">
          <div className="header-row">
            <div>
              <h1>תיק חניך דיגיטלי</h1>
              <div className="subtitle">הגדר אווירון קבוצה ב&apos; — Baron 58 (4X-DZJ)</div>
              <div className="meta">חניך: <strong>{pilotName}</strong></div>
            </div>
            <div className="meta" style={{ textAlign: 'left' }}>
              <div>הופק: {today}</div>
            </div>
          </div>

          {/* Summary */}
          <div className="summary">
            <div className="summary-box">
              <div className="num">{new Set(briefings.filter(r => r.lesson_status === 'S').map(r => r.lesson_number)).size}/4</div>
              <div className="label">תדריכים הושלמו</div>
            </div>
            <div className="summary-box">
              <div className="num">{new Set(flights.filter(r => r.lesson_status === 'S').map(r => r.lesson_number)).size}/8</div>
              <div className="label">שיעורי טיסה</div>
            </div>
            <div className="summary-box">
              <div className="num">{Math.round(totalFlightHours * 10) / 10}</div>
              <div className="label">שעות טיסה</div>
            </div>
          </div>

          {/* Briefings table */}
          <h2>תדריכים כיתתיים</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: '30px' }}>#</th>
                <th>נושא</th>
                <th style={{ width: '60px' }}>שעות</th>
                <th style={{ width: '60px' }}>ציון</th>
                <th style={{ width: '90px' }}>תאריך</th>
                <th>מדריך</th>
              </tr>
            </thead>
            <tbody>
              {BRIEFINGS.map(lesson => {
                const rec = briefings.find(r => r.lesson_number === lesson.number)
                return (
                  <tr key={lesson.number}>
                    <td>{lesson.number}</td>
                    <td>{lesson.title}</td>
                    <td>{lesson.durationHours}</td>
                    <td className={rec ? `status-${rec.lesson_status}` : ''}>
                      {rec ? rec.lesson_status : '—'}
                    </td>
                    <td>{rec ? formatDate(rec.created_at) : '—'}</td>
                    <td>{rec?.instructor_name || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Flight lessons */}
          <h2>שיעורי טיסה</h2>
          {FLIGHT_LESSONS.map(lesson => {
            const lessonRecs = flights.filter(r => r.lesson_number === lesson.number)
              .sort((a, b) => a.created_at.localeCompare(b.created_at))
            return (
              <div key={lesson.number} style={{ marginBottom: '16px' }}>
                <h3>שיעור {lesson.number} — {lesson.title} ({lesson.durationHours} שעות{lesson.instrumentHours ? `, ${lesson.instrumentHours} מכשירים` : ''})</h3>
                {lessonRecs.length === 0 ? (
                  <div className="no-data">לא בוצע</div>
                ) : (
                  lessonRecs.map((rec, idx) => (
                    <div key={rec.id} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
                        ניסיון {idx + 1} | {formatDate(rec.created_at)} | מדריך: {rec.instructor_name || '—'}
                        {rec.instructor_license ? ` (רישיון ${rec.instructor_license})` : ''}
                        {' | '}ציון כולל: <span className={`status-${rec.lesson_status}`}>{statusLabel(rec.lesson_status)}</span>
                      </div>
                      {rec.exercises.length > 0 && (
                        <table>
                          <thead>
                            <tr><th>תרגיל</th><th style={{ width: '120px' }}>ציון</th></tr>
                          </thead>
                          <tbody>
                            {rec.exercises.map(ex => (
                              <tr key={ex.exercise_name}>
                                <td>{ex.exercise_name}</td>
                                <td>{gradeLabel(ex.grade)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {rec.notes && <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>הערות: {rec.notes}</div>}
                    </div>
                  ))
                )}
              </div>
            )
          })}

          <div style={{ marginTop: '24px', borderTop: '1px solid #ccc', paddingTop: '12px', fontSize: '10px', color: '#999' }}>
            Baron Scheduler — Baron 58 (4X-DZJ) | הופק {today}
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelector('.print-btn').addEventListener('click', () => window.print());
        ` }} />
      </body>
    </html>
  )
}
