'use client'

import Header from '@/components/Header'
import BookingForm from '@/components/BookingForm'

export default function HomePage() {
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
          <BookingForm />
        </div>
      </main>
    </div>
  )
}
