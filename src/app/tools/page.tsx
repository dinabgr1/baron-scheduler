'use client'

import Header from '@/components/Header'
import FuelCalculator from '@/components/FuelCalculator'

export default function ToolsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">כלים</h2>
          <p className="text-baron-blue-300">
            Baron 4X-DZJ | כלי עזר לטייסים
          </p>
        </div>

        <FuelCalculator />
      </main>
    </div>
  )
}
