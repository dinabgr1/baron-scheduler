'use client'

import { useState, useEffect, useRef } from 'react'
import { Booking } from '@/lib/supabase'

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const START_HOUR = 6
const END_HOUR = 22
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOUR_HEIGHT = 60

type View = 'day' | '3day' | 'week' | 'month'

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateShort(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function topForTime(time: string): number {
  const minutes = timeToMinutes(time)
  return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
}

function heightForRange(start: string, end: string): number {
  return ((timeToMinutes(end) - timeToMinutes(start)) / 60) * HOUR_HEIGHT
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Get dates for time-grid views (day/3day/week)
function getGridDates(anchor: Date, view: View): Date[] {
  if (view === 'day') return [new Date(anchor)]
  if (view === '3day') {
    return Array.from({ length: 3 }, (_, i) => {
      const d = new Date(anchor)
      d.setDate(anchor.getDate() + i)
      return d
    })
  }
  // week: start from Sunday
  const day = anchor.getDay()
  const sunday = new Date(anchor)
  sunday.setDate(anchor.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

// Get the full month grid (6 rows x 7 cols, starting Sunday)
function getMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  const startDay = first.getDay() // 0=Sun
  const start = new Date(first)
  start.setDate(1 - startDay)

  const weeks: Date[][] = []
  const cursor = new Date(start)
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function getBookingColors(b: Booking) {
  const rejected = b.status === 'rejected'
  if (b.with_instructor) {
    return {
      bg: '#0ea5e9',
      text: 'white',
      opacity: rejected ? 0.4 : 1,
    }
  }
  return {
    bg: '#fef08a',
    text: '#713f12',
    opacity: rejected ? 0.4 : 1,
  }
}

function statusDotColor(status: string): string {
  if (status === 'approved') return '#22c55e'
  if (status === 'rejected') return '#ef4444'
  return '#f59e0b' // pending
}

// --- Booking block for time-grid views ---
function BookingBlock({ b, compact }: { b: Booking; compact?: boolean }) {
  const top = topForTime(b.start_time)
  const height = heightForRange(b.start_time, b.end_time)
  const minHeight = Math.max(height, 28)
  const colors = getBookingColors(b)
  const rejected = b.status === 'rejected'

  return (
    <div
      className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-md overflow-hidden cursor-default ${rejected ? 'line-through' : ''}`}
      style={{
        top,
        height: minHeight,
        backgroundColor: colors.bg,
        color: colors.text,
        opacity: colors.opacity,
        borderLeft: `3px solid ${statusDotColor(b.status)}`,
      }}
      title={`${b.pilot_name} | ${b.start_time.slice(0,5)}-${b.end_time.slice(0,5)}${b.instructor_name ? ` | מדריך: ${b.instructor_name}` : ''} | ${b.status}`}
    >
      <div className="px-1.5 py-0.5 h-full flex flex-col justify-start">
        <div className={`${compact ? 'text-[10px]' : 'text-[11px] md:text-xs'} font-bold truncate leading-tight`}>
          {b.pilot_name}
        </div>
        {minHeight >= 36 && (
          <div className={`${compact ? 'text-[9px]' : 'text-[10px] md:text-[11px]'} opacity-80 leading-tight font-mono`}>
            {b.start_time.slice(0,5)}-{b.end_time.slice(0,5)}
          </div>
        )}
        {minHeight >= 52 && b.instructor_name && (
          <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} opacity-70 truncate leading-tight`}>
            {b.instructor_name}
          </div>
        )}
      </div>
    </div>
  )
}

export default function WeeklyCalendar() {
  const [view, setView] = useState<View>('week')
  const [anchor, setAnchor] = useState<Date>(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = new Date()

  // Compute date range for fetching
  let fetchFrom: string, fetchTo: string
  if (view === 'month') {
    const grid = getMonthGrid(anchor.getFullYear(), anchor.getMonth())
    fetchFrom = formatDate(grid[0][0])
    fetchTo = formatDate(grid[grid.length - 1][6])
  } else {
    const dates = getGridDates(anchor, view)
    fetchFrom = formatDate(dates[0])
    fetchTo = formatDate(dates[dates.length - 1])
  }

  useEffect(() => {
    setLoading(true)
    fetch(`/api/bookings?from=${fetchFrom}&to=${fetchTo}`)
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [fetchFrom, fetchTo])

  // Scroll to 7am on time-grid views
  useEffect(() => {
    if (!loading && scrollRef.current && view !== 'month') {
      scrollRef.current.scrollTop = HOUR_HEIGHT
    }
  }, [loading, view])

  const bookingsByDate: Record<string, Booking[]> = {}
  bookings.forEach(b => {
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = []
    bookingsByDate[b.date].push(b)
  })

  // Navigation
  function navigate(dir: number) {
    const d = new Date(anchor)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === '3day') d.setDate(d.getDate() + dir * 3)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setAnchor(d)
  }

  function goToday() {
    setAnchor(new Date())
  }

  // Header label
  function headerLabel(): string {
    if (view === 'month') {
      return `${MONTHS_HE[anchor.getMonth()]} ${anchor.getFullYear()}`
    }
    const dates = getGridDates(anchor, view)
    if (view === 'day') {
      return `${DAYS_HE[dates[0].getDay()]} ${formatDateShort(dates[0])}`
    }
    return `${formatDateShort(dates[0])} — ${formatDateShort(dates[dates.length - 1])}`
  }

  const isAtToday = view === 'month'
    ? anchor.getMonth() === today.getMonth() && anchor.getFullYear() === today.getFullYear()
    : getGridDates(anchor, view).some(d => isSameDay(d, today))

  const views: { key: View; label: string }[] = [
    { key: 'day', label: 'יום' },
    { key: '3day', label: '3 ימים' },
    { key: 'week', label: 'שבוע' },
    { key: 'month', label: 'חודש' },
  ]

  return (
    <div>
      {/* View switcher */}
      <div className="flex items-center justify-center gap-1 p-3 border-b border-slate-100">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
              ${view === v.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm font-medium">
          ←
        </button>
        <div className="text-center">
          <div className="text-slate-700 font-bold text-sm">{headerLabel()}</div>
          {!isAtToday && (
            <button onClick={goToday} className="text-blue-500 text-xs hover:text-blue-700">
              היום
            </button>
          )}
        </div>
        <button onClick={() => navigate(1)}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm font-medium">
          →
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">טוען...</div>
      ) : view === 'month' ? (
        <MonthView
          anchor={anchor}
          bookingsByDate={bookingsByDate}
          today={today}
        />
      ) : (
        <TimeGridView
          dates={getGridDates(anchor, view)}
          bookingsByDate={bookingsByDate}
          today={today}
          scrollRef={scrollRef}
          compact={view === 'week'}
        />
      )}

      {/* Legend */}
      <div className="p-3 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded" style={{ backgroundColor: '#0ea5e9' }} />עם מדריך
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded" style={{ backgroundColor: '#fef08a' }} />טיסה עצמאית
        </span>
        <span className="mx-1 text-slate-300">|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />ממתין
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />מאושר
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />נדחה
        </span>
      </div>
    </div>
  )
}

// --- Time grid (day / 3-day / week) ---
function TimeGridView({
  dates,
  bookingsByDate,
  today,
  scrollRef,
  compact,
}: {
  dates: Date[]
  bookingsByDate: Record<string, Booking[]>
  today: Date
  scrollRef: React.RefObject<HTMLDivElement>
  compact: boolean
}) {
  return (
    <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '500px' }}>
      {/* Day headers */}
      <div className="flex sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="flex-shrink-0 w-12 md:w-14" />
        {dates.map((d, i) => {
          const isT = isSameDay(d, today)
          return (
            <div key={i} className={`flex-1 text-center py-2 border-l border-slate-100 ${isT ? 'bg-blue-50' : 'bg-white'}`}>
              <div className={`text-xs font-bold ${isT ? 'text-blue-600' : 'text-slate-400'}`}>
                {DAYS_HE[d.getDay()]}
              </div>
              <div className={`text-sm font-bold leading-tight ${isT ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : 'text-slate-700'}`}>
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid body */}
      <div className="flex relative">
        {/* Hour labels */}
        <div className="flex-shrink-0 w-12 md:w-14 relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div key={i} className="absolute w-full text-right pr-2 text-xs text-slate-400 font-mono"
              style={{ top: i * HOUR_HEIGHT - 6 }}>
              {String(START_HOUR + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {dates.map((d, i) => {
          const dateStr = formatDate(d)
          const dayBookings = bookingsByDate[dateStr] || []
          const isT = isSameDay(d, today)

          return (
            <div key={i}
              className={`flex-1 relative border-l border-slate-100 ${isT ? 'bg-blue-50/40' : ''}`}
              style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
              {Array.from({ length: TOTAL_HOURS }, (_, h) => (
                <div key={h} className="absolute w-full border-t border-slate-100" style={{ top: h * HOUR_HEIGHT }} />
              ))}
              {dayBookings.map(b => (
                <BookingBlock key={b.id} b={b} compact={compact} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Month view ---
function MonthView({
  anchor,
  bookingsByDate,
  today,
}: {
  anchor: Date
  bookingsByDate: Record<string, Booking[]>
  today: Date
}) {
  const grid = getMonthGrid(anchor.getFullYear(), anchor.getMonth())
  const currentMonth = anchor.getMonth()

  return (
    <div className="overflow-x-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAYS_HE.map((d, i) => (
          <div key={i} className="text-center py-2 text-xs font-bold text-slate-400 border-l border-slate-100 first:border-l-0">
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {grid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-slate-100">
          {week.map((d, di) => {
            const dateStr = formatDate(d)
            const dayBookings = bookingsByDate[dateStr] || []
            const isT = isSameDay(d, today)
            const isCurrentMonth = d.getMonth() === currentMonth

            return (
              <div
                key={di}
                className={`min-h-[70px] md:min-h-[90px] border-l border-slate-100 first:border-l-0 p-1
                  ${isT ? 'bg-blue-50' : ''}
                  ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className={`text-xs font-bold mb-1 ${isT ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-slate-600 px-0.5'}`}>
                  {d.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map(b => {
                    const colors = getBookingColors(b)
                    const rejected = b.status === 'rejected'
                    return (
                      <div
                        key={b.id}
                        className={`rounded px-1 py-px truncate ${rejected ? 'line-through' : ''}`}
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          opacity: colors.opacity,
                          borderLeft: `2px solid ${statusDotColor(b.status)}`,
                          fontSize: '10px',
                          lineHeight: '14px',
                        }}
                        title={`${b.pilot_name} ${b.start_time.slice(0,5)}-${b.end_time.slice(0,5)}`}
                      >
                        <span className="font-bold">{b.pilot_name.split(' ')[0]}</span>
                        <span className="opacity-75 ml-1 hidden md:inline">{b.start_time.slice(0,5)}</span>
                      </div>
                    )
                  })}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-slate-400 px-1">+{dayBookings.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
