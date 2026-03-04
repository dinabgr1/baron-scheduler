'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Booking, FlightLog } from '@/lib/db'

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const START_HOUR = 6
const END_HOUR = 22
const TOTAL_HOURS = END_HOUR - START_HOUR
const DEFAULT_HOUR_HEIGHT = 40
const MIN_HOUR_HEIGHT = 24
const MAX_HOUR_HEIGHT = 80
const ZOOM_STEP = 8
const VISIBLE_HOURS = 12

const SUBMISSION_WINDOW_DAYS = 7
const EDIT_WINDOW_MINUTES = 60

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

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getGridDates(anchor: Date, view: View): Date[] {
  if (view === 'day') return [new Date(anchor)]
  if (view === '3day') {
    return Array.from({ length: 3 }, (_, i) => {
      const d = new Date(anchor)
      d.setDate(anchor.getDate() + i)
      return d
    })
  }
  const day = anchor.getDay()
  const sunday = new Date(anchor)
  sunday.setDate(anchor.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function getMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
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

// Primary color = flight type. Status shown as left border stripe.
function getBookingStyle(b: Booking): {
  bg: string; text: string; opacity: number;
  borderColor: string; statusLabel: string; statusLabelBg: string; statusLabelText: string
} {
  // Primary: flight type
  const isInstructor = b.with_instructor
  const bg = isInstructor ? '#1e3a5f' : '#dbeafe'          // navy vs sky-100
  const text = isInstructor ? '#ffffff' : '#1e40af'         // white vs blue-800

  // Secondary: status stripe + label
  const statusMap: Record<string, { border: string; label: string; labelBg: string; labelText: string }> = {
    pending:  { border: '#f59e0b', label: '⏳ ממתין',  labelBg: '#fef3c7', labelText: '#92400e' },
    approved: { border: '#22c55e', label: '✓ מאושר',   labelBg: '#dcfce7', labelText: '#166534' },
    rejected: { border: '#ef4444', label: '✕ נדחה',    labelBg: '#fee2e2', labelText: '#991b1b' },
  }
  const s = statusMap[b.status] || statusMap.pending
  return {
    bg,
    text,
    opacity: b.status === 'rejected' ? 0.65 : 1,
    borderColor: s.border,
    statusLabel: s.label,
    statusLabelBg: s.labelBg,
    statusLabelText: s.labelText,
  }
}

function statusDotColor(status: string): string {
  if (status === 'approved') return '#22c55e'
  if (status === 'rejected') return '#ef4444'
  return '#f59e0b'
}

function Tooltip({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-[11px] whitespace-nowrap shadow-lg animate-fade-in">
      {message}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
    </div>
  )
}

function BookingBlock({
  b,
  compact,
  hourHeight,
  onBookingClick,
}: {
  b: Booking
  compact?: boolean
  hourHeight: number
  onBookingClick: (b: Booking) => void
}) {
  const top = ((timeToMinutes(b.start_time) - START_HOUR * 60) / 60) * hourHeight
  const height = ((timeToMinutes(b.end_time) - timeToMinutes(b.start_time)) / 60) * hourHeight
  const minHeight = Math.max(height, 22)
  const style = getBookingStyle(b)
  const rejected = b.status === 'rejected'

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onBookingClick(b) }}
      className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-md overflow-hidden cursor-pointer
        hover:brightness-105 hover:shadow-lg transition-all`}
      style={{
        top,
        height: minHeight,
        backgroundColor: style.bg,
        color: style.text,
        opacity: style.opacity,
        borderRight: `4px solid ${style.borderColor}`,
      }}
      title={`${b.pilot_name} | ${b.start_time.slice(0,5)}-${b.end_time.slice(0,5)}${b.instructor_name ? ` | מדריך: ${b.instructor_name}` : ''} | ${b.status}`}
    >
      {/* Status label - top right */}
      <div className="absolute top-0.5 left-0.5 px-1 py-px rounded text-[8px] font-bold leading-tight whitespace-nowrap"
        style={{ backgroundColor: style.statusLabelBg, color: style.statusLabelText }}>
        {style.statusLabel}
      </div>
      <div className={`px-1.5 pt-4 pb-0.5 h-full flex flex-col justify-start ${rejected ? 'line-through' : ''}`}>
        <div className={`${compact ? 'text-[10px]' : 'text-[11px] md:text-xs'} font-bold truncate leading-tight`}>
          {b.pilot_name}
        </div>
        {minHeight >= 40 && (
          <div className={`${compact ? 'text-[9px]' : 'text-[10px] md:text-[11px]'} opacity-80 leading-tight font-mono`}>
            {b.start_time.slice(0,5)}-{b.end_time.slice(0,5)}
          </div>
        )}
        {minHeight >= 56 && b.instructor_name && (
          <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} opacity-70 truncate leading-tight`}>
            {b.instructor_name}
          </div>
        )}
      </div>
    </div>
  )
}

export default function WeeklyCalendar() {
  const router = useRouter()
  const [view, setView] = useState<View>('week')
  const [anchor, setAnchor] = useState<Date>(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT)
  const [logsByBookingId, setLogsByBookingId] = useState<Record<string, FlightLog>>({})
  const [tooltip, setTooltip] = useState<{ bookingId: string; message: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialScrollDone = useRef(false)
  const today = new Date()

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
    Promise.all([
      fetch(`/api/bookings?from=${fetchFrom}&to=${fetchTo}`).then(r => r.json()),
      fetch('/api/flight-logs').then(r => r.json()),
    ])
      .then(([bookingsData, logsData]) => {
        setBookings(Array.isArray(bookingsData) ? bookingsData : [])
        if (Array.isArray(logsData)) {
          const map: Record<string, FlightLog> = {}
          logsData.forEach((l: FlightLog) => { map[l.booking_id] = l })
          setLogsByBookingId(map)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [fetchFrom, fetchTo])

  useEffect(() => {
    if (!loading && scrollRef.current && view !== 'month' && !initialScrollDone.current) {
      scrollRef.current.scrollTop = (7 - START_HOUR) * hourHeight
      initialScrollDone.current = true
    }
  }, [loading, view, hourHeight])

  // Reset scroll flag when view changes so it scrolls to 7AM on view switch
  useEffect(() => {
    initialScrollDone.current = false
  }, [view])

  const bookingsByDate: Record<string, Booking[]> = {}
  bookings.forEach(b => {
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = []
    bookingsByDate[b.date].push(b)
  })

  const handleBookingClick = useCallback((b: Booking) => {
    const bookingEnd = new Date(b.date + 'T' + b.end_time.substring(0, 5) + ':00')
    const now = new Date()
    const diffMs = now.getTime() - bookingEnd.getTime()
    const diffMinutes = diffMs / (1000 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    const existingLog = logsByBookingId[b.id]

    if (existingLog) {
      // Log already submitted — check if within 1-hour edit window from submission
      const submittedAt = new Date(existingLog.created_at)
      const editDiffMs = now.getTime() - submittedAt.getTime()
      const editDiffMinutes = editDiffMs / (1000 * 60)

      if (editDiffMinutes <= EDIT_WINDOW_MINUTES) {
        // Within edit window — navigate with edit mode
        router.push(`/post-flight?booking_id=${b.id}&edit=1`)
      } else {
        setTooltip({ bookingId: b.id, message: 'פג תוקף הזמן לעריכה. פנה למנהל' })
      }
      return
    }

    // No log yet — check submission window
    if (diffMinutes < 0) {
      setTooltip({ bookingId: b.id, message: 'הטיסה עדיין לא הסתיימה' })
      return
    }

    if (diffDays > SUBMISSION_WINDOW_DAYS) {
      setTooltip({ bookingId: b.id, message: 'פג תוקף הזמן לדיווח. פנה למנהל' })
      return
    }

    // Within 7-day window — navigate to post-flight form
    router.push(`/post-flight?booking_id=${b.id}`)
  }, [logsByBookingId, router])

  const clearTooltip = useCallback(() => setTooltip(null), [])

  function navigate(dir: number) {
    const d = new Date(anchor)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === '3day') d.setDate(d.getDate() + dir * 3)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setAnchor(d)
  }

  function goToday() { setAnchor(new Date()) }

  function headerLabel(): string {
    if (view === 'month') return `${MONTHS_HE[anchor.getMonth()]} ${anchor.getFullYear()}`
    const dates = getGridDates(anchor, view)
    if (view === 'day') return `${DAYS_HE[dates[0].getDay()]} ${formatDateShort(dates[0])}`
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

  const containerHeight = VISIBLE_HOURS * hourHeight

  return (
    <div>
      {/* Legend - sticky top */}
      <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap px-3 py-2 bg-white border-b border-slate-200 text-[11px] text-slate-600 font-medium">
        <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide">סוג טיסה:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-4 rounded-sm" style={{ backgroundColor: '#1e3a5f' }} />עם מדריך
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-4 rounded-sm" style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd' }} />עצמאית
        </span>
        <span className="text-slate-200">│</span>
        <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide">סטטוס:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }} />ממתין
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }} />מאושר
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} />נדחה
        </span>
      </div>

      {/* View switcher + zoom */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <div className="flex items-center gap-1">
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
        {view !== 'month' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setHourHeight(h => Math.max(MIN_HOUR_HEIGHT, h - ZOOM_STEP))}
              disabled={hourHeight <= MIN_HOUR_HEIGHT}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 text-sm font-bold flex items-center justify-center"
            >
              −
            </button>
            <button
              onClick={() => setHourHeight(h => Math.min(MAX_HOUR_HEIGHT, h + ZOOM_STEP))}
              disabled={hourHeight >= MAX_HOUR_HEIGHT}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 text-sm font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>
        )}
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
          onBookingClick={handleBookingClick}
          tooltip={tooltip}
          clearTooltip={clearTooltip}
        />
      ) : (
        <TimeGridView
          dates={getGridDates(anchor, view)}
          bookingsByDate={bookingsByDate}
          today={today}
          scrollRef={scrollRef}
          compact={view === 'week'}
          hourHeight={hourHeight}
          containerHeight={containerHeight}
          onBookingClick={handleBookingClick}
          tooltip={tooltip}
          clearTooltip={clearTooltip}
        />
      )}

    </div>
  )
}

function TimeGridView({
  dates,
  bookingsByDate,
  today,
  scrollRef,
  compact,
  hourHeight,
  containerHeight,
  onBookingClick,
  tooltip,
  clearTooltip,
}: {
  dates: Date[]
  bookingsByDate: Record<string, Booking[]>
  today: Date
  scrollRef: React.RefObject<HTMLDivElement>
  compact: boolean
  hourHeight: number
  containerHeight: number
  onBookingClick: (b: Booking) => void
  tooltip: { bookingId: string; message: string } | null
  clearTooltip: () => void
}) {
  return (
    <div ref={scrollRef} className="overflow-y-auto" style={{ height: containerHeight }}>
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

      <div className="flex relative">
        <div className="flex-shrink-0 w-12 md:w-14 relative" style={{ height: TOTAL_HOURS * hourHeight }}>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div key={i} className="absolute w-full text-right pr-2 text-xs text-slate-400 font-mono"
              style={{ top: i * hourHeight - 6 }}>
              {String(START_HOUR + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {dates.map((d, i) => {
          const dateStr = formatDate(d)
          const dayBookings = bookingsByDate[dateStr] || []
          const isT = isSameDay(d, today)

          return (
            <div key={i}
              className={`flex-1 relative border-l border-slate-100 ${isT ? 'bg-blue-50/40' : ''}`}
              style={{ height: TOTAL_HOURS * hourHeight }}>
              {Array.from({ length: TOTAL_HOURS }, (_, h) => (
                <div key={h} className="absolute w-full border-t border-slate-100" style={{ top: h * hourHeight }} />
              ))}
              {dayBookings.map(b => (
                <div key={b.id} className="relative">
                  <BookingBlock b={b} compact={compact} hourHeight={hourHeight} onBookingClick={onBookingClick} />
                  {tooltip?.bookingId === b.id && (
                    <div className="absolute z-50" style={{
                      top: ((timeToMinutes(b.start_time) - START_HOUR * 60) / 60) * hourHeight - 8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}>
                      <Tooltip message={tooltip.message} onClose={clearTooltip} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MonthView({
  anchor,
  bookingsByDate,
  today,
  onBookingClick,
  tooltip,
  clearTooltip,
}: {
  anchor: Date
  bookingsByDate: Record<string, Booking[]>
  today: Date
  onBookingClick: (b: Booking) => void
  tooltip: { bookingId: string; message: string } | null
  clearTooltip: () => void
}) {
  const grid = getMonthGrid(anchor.getFullYear(), anchor.getMonth())
  const currentMonth = anchor.getMonth()

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAYS_HE.map((d, i) => (
          <div key={i} className="text-center py-2 text-xs font-bold text-slate-400 border-l border-slate-100 first:border-l-0">
            {d}
          </div>
        ))}
      </div>

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
                    const s = getBookingStyle(b)
                    return (
                      <div key={b.id} className="relative">
                        <div
                          onClick={() => onBookingClick(b)}
                          className={`rounded px-1 py-px truncate cursor-pointer hover:brightness-105 transition-all ${b.status === 'rejected' ? 'line-through' : ''}`}
                          style={{
                            backgroundColor: s.bg,
                            color: s.text,
                            opacity: s.opacity,
                            fontSize: '10px',
                            lineHeight: '14px',
                            borderRight: `3px solid ${s.borderColor}`,
                          }}
                          title={`${b.pilot_name} ${b.start_time.slice(0,5)}-${b.end_time.slice(0,5)} | ${b.status}`}
                        >
                          <span className="font-bold">{b.pilot_name.split(' ')[0]}</span>
                          <span className="opacity-75 ml-1 hidden md:inline">{b.start_time.slice(0,5)}</span>
                        </div>
                        {tooltip?.bookingId === b.id && (
                          <Tooltip message={tooltip.message} onClose={clearTooltip} />
                        )}
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
