'use client'

import { useState, useEffect } from 'react'
import { Booking } from '@/lib/supabase'

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 06:00 - 19:00

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
      .then((data) => {
        setBookings(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [from, to])

  function getBookingsForSlot(date: string, hour: number): Booking[] {
    return bookings.filter((b) => {
      if (b.date !== date) return false
      const startHour = parseInt(b.start_time.split(':')[0])
      const endHour = parseInt(b.end_time.split(':')[0])
      const endMin = parseInt(b.end_time.split(':')[1] || '0')
      const effectiveEnd = endMin > 0 ? endHour + 1 : endHour
      return hour >= startHour && hour < effectiveEnd
    })
  }

  function isToday(d: Date): boolean {
    const today = new Date()
    return formatDate(d) === formatDate(today)
  }

  return (
    <div className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 overflow-hidden">
      {/* Week navigation */}
      <div className="flex items-center justify-between p-4 border-b border-baron-blue-700/50">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="px-3 py-2 rounded-lg bg-baron-blue-700/50 hover:bg-baron-blue-600/50 text-white transition-colors text-sm"
        >
          → שבוע קודם
        </button>
        <div className="text-center">
          <h3 className="text-white font-bold">
            {formatDateShort(weekDates[0])} - {formatDateShort(weekDates[6])}
          </h3>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-baron-blue-300 text-xs hover:text-white transition-colors"
          >
            השבוע הנוכחי
          </button>
        </div>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="px-3 py-2 rounded-lg bg-baron-blue-700/50 hover:bg-baron-blue-600/50 text-white transition-colors text-sm"
        >
          שבוע הבא ←
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-baron-blue-300">טוען...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="p-2 text-baron-blue-300 text-xs font-medium border-b border-baron-blue-700/30 w-16">
                  שעה
                </th>
                {weekDates.map((d, i) => (
                  <th
                    key={i}
                    className={`p-2 text-xs font-medium border-b border-baron-blue-700/30 ${
                      isToday(d) ? 'text-yellow-400 bg-baron-blue-800/50' : 'text-baron-blue-300'
                    }`}
                  >
                    <div>{DAYS_HE[i]}</div>
                    <div className="font-mono">{formatDateShort(d)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour} className="border-b border-baron-blue-700/20">
                  <td className="p-1 text-baron-blue-400 text-xs text-center font-mono">
                    {String(hour).padStart(2, '0')}:00
                  </td>
                  {weekDates.map((d, dayIdx) => {
                    const dateStr = formatDate(d)
                    const slotBookings = getBookingsForSlot(dateStr, hour)
                    return (
                      <td
                        key={dayIdx}
                        className={`p-1 border-r border-baron-blue-700/20 align-top ${
                          isToday(d) ? 'bg-baron-blue-800/30' : ''
                        }`}
                      >
                        {slotBookings.map((b) => {
                          const startHour = parseInt(b.start_time.split(':')[0])
                          if (startHour !== hour) return null
                          const statusColors = {
                            pending: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
                            approved: 'bg-green-500/20 border-green-500/50 text-green-200',
                            rejected: 'bg-red-500/20 border-red-500/50 text-red-200',
                          }
                          return (
                            <div
                              key={b.id}
                              className={`text-xs p-1 rounded border mb-1 ${statusColors[b.status]}`}
                            >
                              <div className="font-bold truncate">{b.pilot_name}</div>
                              <div className="opacity-75">
                                {b.start_time.slice(0, 5)}-{b.end_time.slice(0, 5)}
                              </div>
                            </div>
                          )
                        })}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 border-t border-baron-blue-700/50 flex gap-4 justify-center text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50" />
          ממתין
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
          מאושר
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
          נדחה
        </span>
      </div>
    </div>
  )
}
