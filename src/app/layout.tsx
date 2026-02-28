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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
