'use client'

import { useState, useEffect } from 'react'
import { Booking } from '@/lib/supabase'

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

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

export default function WeeklyCalendar() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

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

  function isToday(d: Date): boolean {
    return formatDate(d) === formatDate(new Date())
  }

  // Group bookings by date
  const bookingsByDate: Record<string, Booking[]> = {}
  bookings.forEach(b => {
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = []
    bookingsByDate[b.date].push(b)
  })

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
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

      {loading ? (
        <div className="p-8 text-center text-slate-400">טוען...</div>
      ) : (
        <div className="grid grid-cols-7 divide-x divide-slate-100">
          {weekDates.map((d, i) => {
            const dateStr = formatDate(d)
            const dayBookings = bookingsByDate[dateStr] || []
            const today = isToday(d)
            return (
              <div key={i} className={`min-h-[80px] ${today ? 'bg-blue-50' : ''}`}>
                {/* Day header */}
                <div className={`text-center py-2 border-b border-slate-100 ${today ? 'bg-blue-100' : ''}`}>
                  <div className={`text-xs font-bold ${today ? 'text-blue-600' : 'text-slate-500'}`}>
                    {DAYS_HE[i]}
                  </div>
                  <div className={`text-sm font-bold ${today ? 'text-blue-700' : 'text-slate-700'}`}>
                    {d.getDate()}
                  </div>
                </div>
                {/* Bookings */}
                <div className="p-1 space-y-1">
                  {dayBookings.map(b => {
                    const colors = {
                      pending: 'bg-amber-100 border-amber-300 text-amber-800',
                      approved: 'bg-green-100 border-green-300 text-green-800',
                      rejected: 'bg-red-100 border-red-300 text-red-700 line-through opacity-60',
                    }
                    return (
                      <div key={b.id} className={`text-xs p-1 rounded border ${colors[b.status]}`}>
                        <div className="font-bold truncate">{b.pilot_name.split(' ')[0]}</div>
                        <div className="opacity-75">{b.start_time.slice(0,5)}-{b.end_time.slice(0,5)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="p-3 border-t border-slate-100 flex gap-4 justify-center text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />ממתין
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />מאושר
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />נדחה
        </span>
      </div>
    </div>
  )
}
