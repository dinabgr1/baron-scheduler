'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import PageView from '@/components/PageView'
import PostFlightForm from '@/components/PostFlightForm'

function PostFlightContent() {
  const searchParams = useSearchParams()
  const isEdit = searchParams.get('edit') === '1'
  const title = isEdit ? 'עריכת דיווח' : 'דיווח לאחר טיסה'

  return (
    <>
      <div className="space-y-1">
        <h2 className="font-semibold text-[15px] leading-none">{title}</h2>
        <p className="text-baron-muted text-[12px]">
          Baron 4X-DZJ · מילוי נתוני טיסה
        </p>
      </div>

      <div className="card rounded-xl md:rounded-2xl p-5">
        <PostFlightForm />
      </div>
    </>
  )
}

export default function PostFlightPage() {
  return (
    <div className="min-h-screen bg-baron-bg">
      <PageView page="דוח אחרי טיסה" />
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12 space-y-4">
        <Suspense fallback={<div className="p-8 text-center text-baron-muted">טוען...</div>}>
          <PostFlightContent />
        </Suspense>
      </main>
    </div>
  )
}
