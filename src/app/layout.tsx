import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Baron Scheduler | 4X-DZJ',
  description: 'Beechcraft Baron 4X-DZJ - Flight Scheduling System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
