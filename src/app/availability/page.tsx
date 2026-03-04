'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import PageView from '@/components/PageView'
import BookingForm from '@/components/BookingForm'

export default function AvailabilityPage() {
  const [showBooking, setShowBooking] = useState(false)

  return (
    <div className={`md:h-auto md:min-h-screen bg-baron-bg flex flex-col md:block md:overflow-auto ${showBooking ? 'min-h-screen overflow-auto' : 'fixed inset-0 md:relative md:h-auto overflow-hidden'}`}>
      <PageView page="זמינות" />
      <Header onBookClick={() => setShowBooking(!showBooking)} />

      {/* Hero — desktop only */}
      <div className="hero-img hidden md:flex items-end min-h-[340px]">
        <div className="max-w-[1060px] mx-auto px-8 pb-12 w-full">
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight">
            Baron <span className="gold">58</span>
          </h1>
          <p className="text-baron-text/35 text-[14px] mt-2 tracking-wide">
            Beechcraft · Twin Engine · IFR · 166 Gal
          </p>
        </div>
      </div>

      <div className="w-full h-[3px] bg-gradient-to-l from-baron-red via-baron-gold to-transparent" />

      {/* Mobile spacer for fixed top nav */}
      <div className="h-[55px] md:hidden flex-shrink-0" />

      <main className="max-w-[1060px] mx-auto px-4 md:px-8 pb-24 md:pb-20 flex-1 flex flex-col md:block space-y-4 md:space-y-5 mt-1 md:mt-3 min-h-0">
        {showBooking && (
          <div className="card rounded-xl md:rounded-2xl p-5 space-y-4 animate-fade-in mb-24">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-[15px] leading-none">הזמן טיסה</h2>
              <button
                onClick={() => setShowBooking(false)}
                className="text-baron-muted hover:text-baron-text text-sm"
              >
                ✕
              </button>
            </div>
            <BookingForm onSuccess={() => setShowBooking(false)} />
          </div>
        )}

        <div className="card rounded-xl md:rounded-2xl overflow-hidden flex-1 min-h-0 md:flex-none">
          <WeeklyCalendar />
        </div>
      </main>
    </div>
  )
}
