'use client'

import { useState } from 'react'

const GALLONS_TO_LITERS = 3.785
const TOTAL_CAPACITY_GALLONS = 166
const TOTAL_CAPACITY_LITERS = TOTAL_CAPACITY_GALLONS * GALLONS_TO_LITERS // ~628.41

export default function FuelCalculator() {
  const [desiredGallons, setDesiredGallons] = useState<string>('')
  const [currentLiters, setCurrentLiters] = useState<string>('')

  const desiredLiters = desiredGallons ? parseFloat(desiredGallons) * GALLONS_TO_LITERS : 0
  const toAdd = currentLiters ? Math.max(0, desiredLiters - parseFloat(currentLiters)) : desiredLiters

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
          <label className="text-baron-blue-300 text-xs">כמות נוכחית (ליטרים)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={currentLiters}
            onChange={(e) => setCurrentLiters(e.target.value)}
            placeholder="ליטרים נוכחיים במטוס"
            className="w-full px-3 py-2 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm focus:outline-none focus:border-baron-blue-400"
          />
        </div>
        {desiredGallons && (
          <div className="bg-baron-blue-900/50 rounded p-3 space-y-1">
            <div className="text-sm text-baron-blue-200">
              {desiredGallons} גלונים = <span className="text-white font-bold">{desiredLiters.toFixed(1)} ליטר</span>
            </div>
            {currentLiters && (
              <div className="text-sm text-yellow-300 font-bold">
                ⛽ יש להוסיף: {toAdd.toFixed(1)} ליטר
              </div>
            )}
          </div>
        )}
        <div className="text-xs text-baron-blue-400">
          קיבולת מלאה: {TOTAL_CAPACITY_GALLONS} גלונים ({TOTAL_CAPACITY_LITERS.toFixed(0)} ליטר)
          <br />
          1 גלון = {GALLONS_TO_LITERS} ליטר
        </div>
      </div>
    </div>
  )
}
