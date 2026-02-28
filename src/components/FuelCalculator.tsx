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
    <div className="bg-baron-blue-800/30 rounded-lg border border-baron-blue-700/50 p-4">
      <h4 className="text-baron-blue-200 font-medium text-sm mb-3">
        🧮 מחשבון דלק
      </h4>
      <div className="space-y-3">
        <div>
          <label className="text-baron-blue-300 text-xs">כמות רצויה (גלונים)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max={TOTAL_CAPACITY_GALLONS}
            value={desiredGallons}
            onChange={(e) => setDesiredGallons(e.target.value)}
            placeholder={`מקסימום ${TOTAL_CAPACITY_GALLONS}`}
            className="w-full px-3 py-2 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm focus:outline-none focus:border-baron-blue-400"
          />
        </div>

        <div>
          <label className="text-baron-blue-300 text-xs mb-1 block">כמות נוכחית</label>
          {/* Toggle buttons */}
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => { setCurrentMode('quarters'); setCurrentGallons('') }}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                currentMode === 'quarters'
                  ? 'bg-baron-blue-500 text-white'
                  : 'bg-baron-blue-800/50 text-baron-blue-300 hover:bg-baron-blue-700/50'
              }`}
            >
              רבעים
            </button>
            <button
              type="button"
              onClick={() => { setCurrentMode('gallons'); setCurrentQuarter('') }}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                currentMode === 'gallons'
                  ? 'bg-baron-blue-500 text-white'
                  : 'bg-baron-blue-800/50 text-baron-blue-300 hover:bg-baron-blue-700/50'
              }`}
            >
              גלונים
            </button>
          </div>

          {currentMode === 'quarters' ? (
            <div className="grid grid-cols-4 gap-1">
              {Object.entries(QUARTER_VALUES).map(([label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCurrentQuarter(label)}
                  className={`py-2 rounded text-sm font-medium transition-colors ${
                    currentQuarter === label
                      ? 'bg-baron-blue-500 text-white'
                      : 'bg-baron-blue-800/50 text-baron-blue-300 border border-baron-blue-600/50 hover:bg-baron-blue-700/50'
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
              className="w-full px-3 py-2 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm focus:outline-none focus:border-baron-blue-400"
            />
          )}
        </div>

        {hasDesired && hasCurrent && (
          <div className="bg-baron-blue-900/50 rounded p-3 space-y-1">
            <div className="text-sm text-yellow-300 font-bold">
              ⛽ יש להוסיף: {litersToAdd.toFixed(1)} ליטר ({gallonsToAdd.toFixed(1)} גלונים)
            </div>
          </div>
        )}

        <div className="text-xs text-baron-blue-400">
          קיבולת מלאה: {TOTAL_CAPACITY_GALLONS} גלונים ({(TOTAL_CAPACITY_GALLONS * GALLONS_TO_LITERS).toFixed(0)} ליטר)
          <br />
          1 גלון = {GALLONS_TO_LITERS} ליטר
        </div>
      </div>
    </div>
  )
}
