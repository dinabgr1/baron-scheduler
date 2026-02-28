'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-3xl">✈️</div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">Baron Scheduler</h1>
              <p className="text-blue-600 text-sm font-mono font-bold">4X-DZJ</p>
            </div>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-600 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2">
              <span>📅</span><span>הזמנת טיסה</span>
            </Link>
            <Link href="/post-flight" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2">
              <span>📝</span><span>דיווח לאחר טיסה</span>
            </Link>
            <Link href="/admin" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2">
              <span>🔐</span><span>ניהול</span>
            </Link>
          </nav>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden mt-3 pb-2 border-t border-slate-100 pt-3 flex flex-col gap-1">
            <Link href="/" onClick={() => setMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3">
              <span>📅</span><span>הזמנת טיסה</span>
            </Link>
            <Link href="/post-flight" onClick={() => setMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3">
              <span>📝</span><span>דיווח לאחר טיסה</span>
            </Link>
            <Link href="/admin" onClick={() => setMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3">
              <span>🔐</span><span>ניהול</span>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
