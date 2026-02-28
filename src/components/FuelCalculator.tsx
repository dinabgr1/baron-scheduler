'use client'

import { useState } from 'react'

const GALLONS_TO_LITERS = 3.785
const TOTAL_CAPACITY_GALLONS = 166

const QUARTER_VALUES: Record<string, number> = {
  '¼': 41.5,
  '½': 83,
  '¾': 124.5,
  'מלא': 166,
}

export default function FuelCalculator() {
  const [desiredGallons, setDesiredGallons] = useState<string>('')
  const [currentMode, setCurrentMode] = useState<'quarters' | 'gallons'>('quarters')
  const [currentQuarter, setCurrentQuarter] = useState<string>('')
  const [currentGallons, setCurrentGallons] = useState<string>('')

  const desired = desiredGallons ? parseFloat(desiredGallons) : 0
  const current = currentMode === 'quarters'
    ? (currentQuarter ? QUARTER_VALUES[currentQuarter] : 0)
    : (currentGallons ? parseFloat(currentGallons) : 0)

  const gallonsToAdd = Math.max(0, desired - current)
  const litersToAdd = gallonsToAdd * GALLONS_TO_LITERS

  const hasDesired = desiredGallons !== ''
  const hasCurrent = currentMode === 'quarters' ? currentQuarter !== '' : currentGallons !== ''

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h4 className="text-slate-800 font-bold text-base mb-4 flex items-center gap-2">
        ⛽ מחשבון דלק
      </h4>
      <div className="space-y-4">
        <div>
          <label className="text-slate-600 text-sm font-medium mb-1.5 block">כמות רצויה (גלונים)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max={TOTAL_CAPACITY_GALLONS}
            value={desiredGallons}
            onChange={(e) => setDesiredGallons(e.target.value)}
            placeholder={`מקסימום ${TOTAL_CAPACITY_GALLONS}`}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="text-slate-600 text-sm font-medium mb-1.5 block">כמות נוכחית</label>
          {/* Toggle buttons */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => { setCurrentMode('quarters'); setCurrentGallons('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                currentMode === 'quarters'
                  ? 'bg-[#1e3a5f] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              רבעים
            </button>
            <button
              type="button"
              onClick={() => { setCurrentMode('gallons'); setCurrentQuarter('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                currentMode === 'gallons'
                  ? 'bg-[#1e3a5f] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              גלונים
            </button>
          </div>

          {currentMode === 'quarters' ? (
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(QUARTER_VALUES).map(([label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCurrentQuarter(label)}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${
                    currentQuarter === label
                      ? 'bg-amber-500 text-white shadow-sm scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="number"
              step="0.1"
              min="0"
              max={TOTAL_CAPACITY_GALLONS}
              value={currentGallons}
              onChange={(e) => setCurrentGallons(e.target.value)}
              placeholder="גלונים נוכחיים במטוס"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          )}
        </div>

        {hasDesired && hasCurrent && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-base font-bold text-amber-800">
              ⛽ יש להוסיף: {litersToAdd.toFixed(1)} ליטר
            </div>
            <div className="text-sm text-amber-600 mt-0.5">
              ({gallonsToAdd.toFixed(1)} גלונים)
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          קיבולת מלאה: {TOTAL_CAPACITY_GALLONS} גלונים ({(TOTAL_CAPACITY_GALLONS * GALLONS_TO_LITERS).toFixed(0)} ליטר)
          &nbsp;·&nbsp; 1 גלון = {GALLONS_TO_LITERS} ליטר
        </div>
      </div>
    </div>
  )
}
