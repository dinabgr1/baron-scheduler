'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/availability', label: 'זמינות', icon: '📅' },
  { href: '/post-flight', label: 'לאחר טיסה', icon: '📝' },
  { href: '/pilot', label: 'הטייס שלי', icon: '✈️' },
  { href: '/tools', label: 'כלים', icon: '🔧' },
  { href: '/admin', label: 'ניהול', icon: '⚙️' },
]

export default function Header({ onBookClick }: { onBookClick?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop nav — dark bar */}
      <nav className="fixed top-0 w-full z-50 hidden md:block bg-baron-dark">
        <div className="max-w-[1060px] mx-auto px-8 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-baseline gap-2.5">
              <span className="text-[17px] font-bold tracking-tight leading-none text-white">
                <span className="text-baron-red">B</span>ARON
              </span>
              <span className="text-baron-gold-light/50 text-[11px] font-mono tracking-[0.12em] leading-none">4X-DZJ</span>
            </Link>
            <div className="flex items-center gap-0.5 text-[13px]">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      isActive
                        ? 'text-baron-gold-light font-medium bg-white/10'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          {onBookClick && (
            <button
              onClick={onBookClick}
              className="gold-bg text-[13px] font-semibold px-5 py-2 rounded-lg hover:brightness-110 transition-all"
            >
              + הזמן טיסה
            </button>
          )}
        </div>
        <div className="accent-stripe" />
      </nav>

      {/* Mobile top nav — dark */}
      <nav className="fixed top-0 w-full z-50 md:hidden bg-baron-dark">
        <div className="px-4 h-[52px] flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold tracking-tight leading-none text-white">
              <span className="text-baron-red">B</span>ARON
            </span>
            <span className="text-baron-gold-light/50 text-[10px] font-mono tracking-[0.12em] leading-none">4X-DZJ</span>
          </Link>
          {onBookClick && (
            <button
              onClick={onBookClick}
              className="gold-bg text-[12px] font-semibold px-4 py-1.5 rounded-lg"
            >
              + הזמן טיסה
            </button>
          )}
        </div>
        <div className="accent-stripe" />
      </nav>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-baron-dark z-50">
        <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'bg-white/10' : ''
                }`}
              >
                <span className="text-[16px]">{item.icon}</span>
                <span className={`text-[10px] font-medium leading-none ${
                  isActive ? 'text-baron-gold-light font-semibold' : 'text-white/40'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
