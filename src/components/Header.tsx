'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-baron-blue-900/80 backdrop-blur-sm border-b border-baron-blue-700/50 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-3xl">✈️</div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Baron Scheduler</h1>
              <p className="text-baron-blue-300 text-sm font-mono">4X-DZJ</p>
            </div>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLinks />
          </nav>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden mt-3 pt-3 border-t border-baron-blue-700/50 flex flex-col gap-2">
            <NavLinks onClick={() => setMenuOpen(false)} />
          </nav>
        )}
      </div>
    </header>
  )
}

function NavLinks({ onClick }: { onClick?: () => void }) {
  const links = [
    { href: '/', label: 'הזמנת טיסה', icon: '📅' },
    { href: '/post-flight', label: 'דיווח לאחר טיסה', icon: '📝' },
    { href: '/admin', label: 'ניהול', icon: '🔐' },
  ]

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClick}
          className="px-4 py-2 rounded-lg text-sm font-medium text-baron-blue-200 hover:text-white hover:bg-baron-blue-700/50 transition-colors flex items-center gap-2"
        >
          <span>{link.icon}</span>
          <span>{link.label}</span>
        </Link>
      ))}
    </>
  )
}
