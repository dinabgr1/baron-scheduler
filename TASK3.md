# Task 3 - Pilot CRM Cards

## Overview
Build a full pilot CRM system. Each pilot gets a "customer card" that shows all their flights, billing, and info.

## 1. Auto-create pilot on booking submit

In `src/app/api/bookings/route.ts` (POST handler), after creating the booking:
- Check if a pilot with that name already exists in the `pilots` table
- If NOT, auto-create one: `{ name: pilot_name, phone: phone (from booking), is_active: true }`
- Use getServiceClient() for this

## 2. New admin section: "טייסים" tab - full pilot list with cards

In `src/app/admin/page.tsx`, update the "טייסים" tab completely:

### Pilot List View
- Show all pilots as cards (not a plain table)
- Each pilot card shows:
  - Name (large, bold)
  - Phone number
  - License number (if set)
  - Hours balance summary: "X שעות נותרו מתוך Y שנרכשו"
  - Count of future bookings
  - Status indicator (active/inactive)
  - Button: "פתח כרטיס" → opens pilot detail modal

### Add Pilot button
- Form: name (required), phone, license_number
- Submit creates pilot via POST /api/pilots

## 3. Pilot Detail Modal/Page

When clicking "פתח כרטיס" on a pilot card, open a full-screen modal (or navigate to `/admin/pilots/[id]`).

**Use a new page: `src/app/admin/pilots/[id]/page.tsx`**

This page is password-protected (same admin password check, use cookie/localStorage like existing admin page).

### Layout (3 sections):

#### Section A - Pilot Header
- Large name + edit button (inline edit name, phone, license, email)
- Status toggle (active/inactive)
- Quick stats row:
  - ✈️ סה"כ טיסות: N
  - ⏱️ שעות כולל: X.X
  - 💰 יתרת שעות: X.X
  - 📅 טיסה אחרונה: DD/MM/YYYY

#### Section B - Billing & Hours (tabs: "שעות" | "חשבון")

**שעות tab:**
- Hour packages table: תאריך רכישה | שעות שנרכשו | שעות שנוצלו | יתרה | מחיר ששולם
- "הוסף חבילת שעות" button → inline form: hours_purchased, price_paid, purchase_date, notes
- Total balance shown prominently at top: big number, green if positive, red if zero/negative

**חשבון tab:**
- List of all billing records linked to this pilot
- Each row: תאריך | סוג טיסה | שעות | תעריף | סכום | אמצעי תשלום
- "הוסף חיוב ידני" button → form: date, hours, rate (fetch from rates table), notes
- Summary at bottom: סה"כ חויב: ₪X,XXX

#### Section C - Flights History

Two sub-tabs: "טיסות עתידיות" | "טיסות שעברו"

**עתידיות:**
- All bookings with status pending/approved where date >= today and pilot_name matches
- Show: תאריך | שעות | סטטוס | עם מדריך
- Status badges (colored pills)

**שעברו:**
- All bookings where date < today, pilot_name matches
- Show: תאריך | שעות | Hobbs | דלק | שמן (from flight_logs joined to bookings)
- If no flight log: show "אין דיווח" in amber
- Total hours flown calculated from flight_logs (hobbs_end - hobbs_start or flight_time_hours)

## 4. New API routes needed

**src/app/api/pilots/[id]/bookings/route.ts:**
GET - fetch all bookings where pilot_name = pilot.name, ordered by date desc

**src/app/api/pilots/[id]/flight-logs/route.ts:**
GET - fetch all flight_logs joined to bookings where pilot_name = pilot.name

**src/app/api/pilots/[id]/billing/route.ts:**
GET - fetch billing_records where pilot_name = pilot.name
POST - create new billing record for this pilot

**src/app/api/pilots/[id]/packages/route.ts:**
GET - fetch hour_packages where pilot_name = pilot.name
POST - create new hour_packages for this pilot (also update pilot's total)

## 5. Back-link from booking to pilot

In the admin bookings list (`הזמנות` tab), add a small link next to each pilot name:
- "👤" icon that links to `/admin/pilots/[id]` if pilot exists in DB
- Clicking it opens their pilot card

To find the pilot: query pilots table by name match when rendering the list.

## 6. Supabase update

Add to `supabase-billing-setup.sql` (and run separately):
```sql
-- Add billing_records linked to pilots by name
CREATE TABLE IF NOT EXISTS billing_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  pilot_name TEXT NOT NULL,
  flight_date DATE,
  hours_flown DECIMAL(10,2),
  rate_per_hour DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  payment_method TEXT DEFAULT 'בנק שעות',
  package_id UUID REFERENCES hour_packages(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_billing" ON billing_records FOR ALL USING (auth.role() = 'service_role');
```

Also create file `supabase-billing-records.sql` with just the billing_records table creation.

## Design Guidelines
- Page uses the same navy/white design system as rest of app
- Mobile responsive
- All Hebrew RTL
- Back button at top: "← חזרה לניהול"
- Use Tailwind classes (no custom CSS)
- Loading states for all async fetches
- Error handling (show error message if fetch fails)

## Final steps
1. npm run build
2. Fix all TypeScript errors
3. git add -A && git commit -m "Pilot CRM: customer cards with full history and billing"
4. npx vercel --prod --yes
5. openclaw system event --text "Pilot CRM deployed" --mode now
