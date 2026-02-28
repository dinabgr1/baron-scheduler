'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import BookingForm from '@/components/BookingForm'
import WeeklyCalendar from '@/components/WeeklyCalendar'

export default function HomePage() {
  const [calendarKey, setCalendarKey] = useState(0)

  const handleBookingSuccess = useCallback(() => {
    setCalendarKey(k => k + 1)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">הזמנת טיסה</h2>
          <p className="text-slate-500 text-sm">Beechcraft Baron 58 | <span className="font-mono font-bold text-blue-600">4X-DZJ</span></p>
        </div>

        {/* Booking Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-slate-800 font-bold text-lg mb-4">📋 טופס הזמנה</h3>
          <BookingForm onSuccess={handleBookingSuccess} />
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-slate-800 font-bold text-lg">📅 זמינות המטוס</h3>
          </div>
          <WeeklyCalendar key={calendarKey} />
        </div>
      </main>
    </div>
  )
}
