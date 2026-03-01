'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/availability', label: 'הזמנה', icon: '✈️' },
  { href: '/post-flight', label: 'דיווח', icon: '📝' },
  { href: '/pilot', label: 'הטייס שלי', icon: '👤' },
  { href: '/tools', label: 'כלים', icon: '🔧' },
  { href: '/admin', label: 'ניהול', icon: '⚙️' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop header */}
      <header className="bg-[#1e3a5f] sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-white font-bold text-xl">Baron Scheduler</span>
            <span className="text-amber-400 font-mono font-bold">4X-DZJ</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors ${
                  isActive ? 'text-[#1e3a5f]' : 'text-gray-400'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
