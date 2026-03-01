'use client'

import { useState } from 'react'

type ChecklistCategory = {
  name: string
  items: string[]
}

const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  { name: 'חיצוני', items: ['מצב כללי', 'אנטנות', 'Pitot tube', 'שמשות', 'צמיגים', 'דלק (ניקוז)', 'שמן'] },
  { name: 'קוקפיט', items: ['מסמכי מטוס', 'חגורות', 'מכשירים', 'רדיו', 'GPS', 'Autopilot'] },
  { name: 'מנועים', items: ['שמן מנוע 1', 'שמן מנוע 2', 'קירור', 'Exhaust'] },
  { name: 'בקרות', items: ['הגאים', 'דוושות', 'Throttle', 'Mixture', 'Props'] },
]

const ALL_ITEMS = CHECKLIST_CATEGORIES.flatMap(c => c.items.map(i => `${c.name}:${i}`))

type Props = {
  bookingId: string
  pilotName?: string
  onComplete?: () => void
  existingChecklist?: Record<string, boolean> | null
}

export default function PreFlightChecklist({ bookingId, pilotName, onComplete, existingChecklist }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>(existingChecklist || {})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(!!existingChecklist)

  const allChecked = ALL_ITEMS.every(item => checked[item])
  const checkedCount = ALL_ITEMS.filter(item => checked[item]).length

  function toggle(key: string) {
    if (done) return
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function submit() {
    if (!allChecked) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          pilot_name: pilotName,
          checklist_data: checked,
        }),
      })
      if (res.ok) {
        setDone(true)
        onComplete?.()
      }
    } catch {
      alert('שגיאה בשמירת הצ\'קליסט')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-gray-900 font-bold text-lg">✅ בדיקה לפני טיסה — Baron 58</h3>
        <span className="text-sm text-gray-500">{checkedCount}/{ALL_ITEMS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${allChecked ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${(checkedCount / ALL_ITEMS.length) * 100}%` }}
        />
      </div>

      {CHECKLIST_CATEGORIES.map(cat => (
        <div key={cat.name} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h4 className="text-gray-900 font-semibold text-sm mb-3 flex items-center gap-2">
            {cat.name === 'חיצוני' && '🔍'}
            {cat.name === 'קוקפיט' && '🎛️'}
            {cat.name === 'מנועים' && '⚙️'}
            {cat.name === 'בקרות' && '🕹️'}
            {cat.name}
          </h4>
          <div className="space-y-2">
            {cat.items.map(item => {
              const key = `${cat.name}:${item}`
              return (
                <label key={key} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  checked[key] ? 'bg-green-50' : 'hover:bg-gray-50'
                } ${done ? 'cursor-default' : ''}`}>
                  <input
                    type="checkbox"
                    checked={!!checked[key]}
                    onChange={() => toggle(key)}
                    disabled={done}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className={`text-sm ${checked[key] ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                    {item}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      {done ? (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-center font-medium">
          ✅ הצ&apos;קליסט הושלם בהצלחה
        </div>
      ) : (
        <button
          onClick={submit}
          disabled={!allChecked || submitting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
            allChecked
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? 'שומר...' : allChecked ? 'אישור והמשך ✅' : `סמן את כל הפריטים (${checkedCount}/${ALL_ITEMS.length})`}
        </button>
      )}
    </div>
  )
}
