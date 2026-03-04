import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Baron 58 | 4X-DZJ',
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
        <meta name="theme-color" content="#eef0f4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans leading-relaxed">
        {children}
      </body>
    </html>
  )
}
