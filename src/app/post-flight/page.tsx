'use client'

import { Suspense } from 'react'
import Header from '@/components/Header'
import PostFlightForm from '@/components/PostFlightForm'

export default function PostFlightPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">דיווח לאחר טיסה</h2>
          <p className="text-baron-blue-300">
            Baron 4X-DZJ | מילוי נתוני טיסה
          </p>
        </div>

        <div className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-6">
          <Suspense fallback={<div className="p-8 text-center text-baron-blue-300">טוען...</div>}>
            <PostFlightForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
