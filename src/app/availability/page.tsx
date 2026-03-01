'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import BookingForm from '@/components/BookingForm'

export default function AvailabilityPage() {
  const [showBooking, setShowBooking] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">זמינות המטוס</h2>
          <p className="text-slate-500 text-sm">Beechcraft Baron 58 | <span className="font-mono font-bold text-blue-600">4X-DZJ</span></p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <WeeklyCalendar />
        </div>

        {!showBooking ? (
          <button
            onClick={() => setShowBooking(true)}
            className="w-full py-4 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-lg transition-colors shadow-sm flex items-center justify-center gap-2">
            ✈️ הזמן טיסה
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">הזמנת טיסה</h3>
              <button onClick={() => setShowBooking(false)}
                className="text-slate-400 hover:text-slate-600 text-sm">
                ✕ סגור
              </button>
            </div>
            <BookingForm onSuccess={() => setShowBooking(false)} />
          </div>
        )}
      </main>
    </div>
  )
}
