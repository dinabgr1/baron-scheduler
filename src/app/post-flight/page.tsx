'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import PostFlightForm from '@/components/PostFlightForm'

function PostFlightContent() {
  const searchParams = useSearchParams()
  const isEdit = searchParams.get('edit') === '1'
  const title = isEdit ? 'עריכת דיווח' : 'דיווח לאחר טיסה'

  return (
    <>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-500">
          Baron 4X-DZJ | מילוי נתוני טיסה
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <PostFlightForm />
      </div>
    </>
  )
}

export default function PostFlightPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        <Suspense fallback={<div className="p-8 text-center text-gray-500">טוען...</div>}>
          <PostFlightContent />
        </Suspense>
      </main>
    </div>
  )
}
