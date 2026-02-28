'use client'

import { useState, useEffect, useRef } from 'react'
import { Booking } from '@/lib/supabase'

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const START_HOUR = 6
const END_HOUR = 22
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOUR_HEIGHT = 60 // px per hour

function getWeekDates(offset: number): Date[] {
  const today = new Date()
  const day = today.getDay()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - day + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
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
  const startMinutes = START_HOUR * 60
  return ((minutes - startMinutes) / 60) * HOUR_HEIGHT
}

function heightForRange(start: string, end: string): number {
  const startMin = timeToMinutes(start)
  const endMin = timeToMinutes(end)
  return ((endMin - startMin) / 60) * HOUR_HEIGHT
}

export default function WeeklyCalendar() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileStart, setMobileStart] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const weekDates = getWeekDates(weekOffset)
  const from = formatDate(weekDates[0])
  const to = formatDate(weekDates[6])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/bookings?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => { setBookings(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [from, to])

  // Reset mobile start when week changes
  useEffect(() => { setMobileStart(0) }, [weekOffset])

  // Scroll to 7:00 on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = HOUR_HEIGHT // 1 hour below START_HOUR (06:00) = 07:00
    }
  }, [loading])

  function isToday(d: Date): boolean {
    return formatDate(d) === formatDate(new Date())
  }

  const bookingsByDate: Record<string, Booking[]> = {}
  bookings.forEach(b => {
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = []
    bookingsByDate[b.date].push(b)
  })

  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    pending: { bg: 'bg-amber-100/80', border: 'border-amber-400', text: 'text-amber-900' },
    approved: { bg: 'bg-green-100/80', border: 'border-green-400', text: 'text-green-900' },
    rejected: { bg: 'bg-red-100/60', border: 'border-red-400', text: 'text-red-800 line-through' },
  }

  const MOBILE_DAYS = 3

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <button onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm font-medium">
          ←
        </button>
        <div className="text-center">
          <div className="text-slate-700 font-bold text-sm">
            {formatDateShort(weekDates[0])} — {formatDateShort(weekDates[6])}
          </div>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              className="text-blue-500 text-xs hover:text-blue-700">
              חזור לשבוע הנוכחי
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm font-medium">
          →
        </button>
      </div>

      {/* Mobile day nav */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
        <button
          onClick={() => setMobileStart(Math.max(0, mobileStart - MOBILE_DAYS))}
          disabled={mobileStart === 0}
          className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold">
          ‹
        </button>
        <span className="text-xs text-slate-500 font-medium">
          {formatDateShort(weekDates[mobileStart])} — {formatDateShort(weekDates[Math.min(mobileStart + MOBILE_DAYS - 1, 6)])}
        </span>
        <button
          onClick={() => setMobileStart(Math.min(7 - MOBILE_DAYS, mobileStart + MOBILE_DAYS))}
          disabled={mobileStart >= 7 - MOBILE_DAYS}
          className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold">
          ›
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">טוען...</div>
      ) : (
        <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '500px' }}>
          {/* Day headers row */}
          <div className="flex sticky top-0 z-10 bg-white border-b border-slate-200">
            {/* Time axis header */}
            <div className="flex-shrink-0 w-12 md:w-14" />
            {/* Day columns */}
            {weekDates.map((d, i) => {
              const today = isToday(d)
              const hiddenOnMobile = i < mobileStart || i >= mobileStart + MOBILE_DAYS
              return (
                <div
                  key={i}
                  className={`flex-1 text-center py-2 border-l border-slate-100
                    ${today ? 'bg-blue-50' : 'bg-white'}
                    ${hiddenOnMobile ? 'hidden md:block' : ''}`}
                >
                  <div className={`text-xs font-bold ${today ? 'text-blue-600' : 'text-slate-400'}`}>
                    {DAYS_HE[i]}
                  </div>
                  <div className={`text-sm font-bold leading-tight ${today ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : 'text-slate-700'}`}>
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div className="flex relative">
            {/* Hour labels */}
            <div className="flex-shrink-0 w-12 md:w-14 relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full text-right pr-2 text-xs text-slate-400 font-mono"
                  style={{ top: i * HOUR_HEIGHT - 6 }}
                >
                  {String(START_HOUR + i).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day columns with bookings */}
            {weekDates.map((d, i) => {
              const dateStr = formatDate(d)
              const dayBookings = bookingsByDate[dateStr] || []
              const today = isToday(d)
              const hiddenOnMobile = i < mobileStart || i >= mobileStart + MOBILE_DAYS

              return (
                <div
                  key={i}
                  className={`flex-1 relative border-l border-slate-100
                    ${today ? 'bg-blue-50/40' : ''}
                    ${hiddenOnMobile ? 'hidden md:block' : ''}`}
                  style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                >
                  {/* Hour grid lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-slate-100"
                      style={{ top: h * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Booking blocks */}
                  {dayBookings.map(b => {
                    const top = topForTime(b.start_time)
                    const height = heightForRange(b.start_time, b.end_time)
                    const colors = statusColors[b.status] || statusColors.pending
                    const minHeight = Math.max(height, 28)

                    return (
                      <div
                        key={b.id}
                        className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-md border-l-[3px] ${colors.bg} ${colors.border} ${colors.text} overflow-hidden cursor-default`}
                        style={{ top, height: minHeight }}
                        title={`${b.pilot_name} | ${b.start_time.slice(0,5)}-${b.end_time.slice(0,5)}${b.instructor_name ? ` | מדריך: ${b.instructor_name}` : ''}`}
                      >
                        <div className="px-1.5 py-0.5 h-full flex flex-col justify-start">
                          <div className="text-[11px] md:text-xs font-bold truncate leading-tight">
                            {b.pilot_name}
                          </div>
                          {minHeight >= 36 && (
                            <div className="text-[10px] md:text-[11px] opacity-75 leading-tight font-mono">
                              {b.start_time.slice(0,5)}-{b.end_time.slice(0,5)}
                            </div>
                          )}
                          {minHeight >= 52 && b.instructor_name && (
                            <div className="text-[10px] opacity-65 truncate leading-tight">
                              מדריך: {b.instructor_name}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 border-t border-slate-200 flex gap-4 justify-center text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-l-[3px] border-amber-400 bg-amber-100" />ממתין
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-l-[3px] border-green-400 bg-green-100" />מאושר
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-l-[3px] border-red-400 bg-red-100" />נדחה
        </span>
      </div>
    </div>
  )
}
