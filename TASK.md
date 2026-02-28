# Baron Scheduler - Complete Overhaul Task

## MISSION
Complete overhaul of baron-scheduler. Make it world-class. Mobile-first. Hebrew only.
After ALL changes: npm run build, fix errors, git commit, npx vercel --prod --yes, then run: openclaw system event --text "Baron overhaul deployed" --mode now

---

## PHASE 1 - DESIGN OVERHAUL

### globals.css
Add at top of body styles: background-color: #f0f4f8

### Header (src/components/Header.tsx)
Complete redesign:
- Desktop: full-width navy header (bg-[#1e3a5f]), white logo text, amber '4X-DZJ', white nav links
- Mobile: compact logo header + sticky BOTTOM nav bar with 4 items:
  - ✈️ הזמנה → /
  - 📅 זמינות → /availability  
  - 📝 דיווח → /post-flight
  - ⚙️ ניהול → /admin
- Bottom nav: fixed bottom-0, white bg, border-top, navy text for active, gray for inactive
- Use usePathname() to detect active route for bottom nav
- Add pb-16 to main content on mobile so it doesn't hide behind bottom nav

### BookingForm (src/components/BookingForm.tsx)
- Add phone field: type=tel, label="טלפון", required, after pilot_name
- Add flight_purpose dropdown: label="מטרת הטיסה", options: ["אימון","טיסה פרטית","טיסה עצמאית","אחר"], default "אימון"
- Include phone and flight_purpose in the POST body
- Better styling: all inputs rounded-xl with focus:ring-blue-500
- Submit button: bg-[#1e3a5f] hover:bg-[#1e40af] with transition

### Home page (src/app/page.tsx)
Add hero banner above the form card:
```jsx
<div className="bg-[#1e3a5f] text-white rounded-2xl p-4 flex items-center gap-4">
  <span className="text-4xl">✈️</span>
  <div>
    <div className="font-bold text-lg">Beechcraft Baron 58</div>
    <div className="text-amber-400 font-mono font-bold">4X-DZJ</div>
    <div className="text-slate-300 text-sm">מוכן לטיסה הבאה שלך</div>
  </div>
</div>
```

### Admin page (src/app/admin/page.tsx)
After login, BEFORE the existing content, add 4 stats cards in a 2x2 grid:
- סה"כ הזמנות החודש
- ממתינות לאישור  
- שעות טיסה החודש (from flight_logs: sum of flight_time_hours + flight_time_minutes/60)
- Hobbs אחרון (last hobbs_end)

Stats cards style: white bg, rounded-2xl, shadow-sm, navy number, gray label.

Add tabs below stats: ['הזמנות', 'טייסים', 'תעריפים', 'בנק שעות']
Default active: 'הזמנות' (existing functionality unchanged)

**טייסים tab:**
- Fetch from /api/pilots
- Table: שם | טלפון | רישיון | פעיל
- Add pilot form: name (required), phone, license_number
- Edit/Delete buttons per row

**תעריפים tab:**
- Fetch from /api/rates
- Table: שם | מחיר לשעה (₪) | תיאור
- Editable inline (click to edit price)
- Add rate form

**בנק שעות tab:**
- Fetch from /api/hour-packages
- Table: טייס | שעות שנרכשו | שעות שנוצלו | יתרה | תשלום | תאריך
- Balance (יתרה) = hours_purchased - hours_used, green if >0, red if <=0
- Add package form: pilot_name, hours_purchased, price_paid, purchase_date, notes

---

## PHASE 2 - DATABASE & API

### Create supabase-billing-setup.sql in project root
Content:
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flight_purpose TEXT DEFAULT 'אימון';

CREATE TABLE IF NOT EXISTS pilots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  rate_per_hour DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hour_packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pilot_id UUID REFERENCES pilots(id),
  pilot_name TEXT NOT NULL,
  hours_purchased DECIMAL(10,1) NOT NULL,
  hours_used DECIMAL(10,1) DEFAULT 0,
  price_paid DECIMAL(10,2),
  purchase_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hour_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_pilots" ON pilots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_rates" ON rates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_rates" ON rates FOR SELECT USING (true);
CREATE POLICY "service_packages" ON hour_packages FOR ALL USING (auth.role() = 'service_role');
```

### New API routes

**src/app/api/pilots/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export async function GET() {
  const { data, error } = await getServiceClient().from('pilots').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await getServiceClient().from('pilots').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

**src/app/api/pilots/[id]/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { data, error } = await getServiceClient().from('pilots').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await getServiceClient().from('pilots').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

**src/app/api/rates/route.ts** - same pattern as pilots but table='rates'
**src/app/api/rates/[id]/route.ts** - same pattern as pilots/[id] but table='rates'
**src/app/api/hour-packages/route.ts** - same pattern as pilots but table='hour_packages'
**src/app/api/hour-packages/[id]/route.ts** - same pattern as pilots/[id] but table='hour_packages'

### Update src/lib/supabase.ts - add types at bottom:
```typescript
export type Pilot = { id: string; name: string; phone: string|null; email: string|null; license_number: string|null; is_active: boolean; created_at: string }
export type Rate = { id: string; name: string; rate_per_hour: number; description: string|null; is_active: boolean; created_at: string }
export type HourPackage = { id: string; pilot_id: string|null; pilot_name: string; hours_purchased: number; hours_used: number; price_paid: number|null; purchase_date: string; notes: string|null; created_at: string }
```

---

## PHASE 3 - PWA

### public/manifest.json:
```json
{"name":"Baron Scheduler","short_name":"Baron","start_url":"/","display":"standalone","background_color":"#f0f4f8","theme_color":"#1e3a5f","lang":"he","dir":"rtl"}
```

### src/app/layout.tsx - add to head:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1e3a5f" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

---

## FINAL
1. npm run build
2. Fix ALL TypeScript errors
3. git add -A && git commit -m "Major overhaul: premium design + billing system + PWA"
4. npx vercel --prod --yes
5. openclaw system event --text "Baron overhaul deployed to production" --mode now
