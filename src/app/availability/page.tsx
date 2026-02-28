'use client'

import Header from '@/components/Header'
import WeeklyCalendar from '@/components/WeeklyCalendar'

export default function AvailabilityPage() {
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
      </main>
    </div>
  )
}
