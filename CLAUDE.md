# Baron Scheduler — Project Context

## About
Flight scheduling web app for Beechcraft Baron 58, registration 4X-DZJ.
Owner: Din (pilot + flight instructor)

## URLs
- Production: https://baron-scheduler.vercel.app
- Admin panel: https://baron-scheduler.vercel.app/admin (password: BaronAdmin)
- Availability: https://baron-scheduler.vercel.app/availability

## Tech Stack
- Next.js 14 (App Router)
- Supabase: project ID wqethdnkquhfxjelwtqw
- Vercel (hosting, free tier)
- Tailwind CSS

## Key Files
- src/components/WeeklyCalendar.tsx — Google Calendar style, views: day/3-day/week/month, zoom +/-
- src/components/BookingForm.tsx — public booking form
- src/components/PostFlightForm.tsx — post-flight log (Hobbs, fuel, oil)
- src/components/FuelCalculator.tsx — liters↔gallons calculator
- src/app/admin/page.tsx — admin panel
- src/app/availability/page.tsx — availability calendar page
- src/app/api/bookings/route.ts — bookings API
- src/app/api/flight-logs/route.ts — flight logs API
- supabase-setup.sql — DB schema

## Database Tables
- bookings: id, pilot_name, date, start_time, end_time, with_instructor, instructor_name, status (pending/approved/rejected), google_event_id
- flight_logs: id, booking_id, hobbs_start, hobbs_end, flight_time_hours, flight_time_minutes, fuel_added_liters, fuel_level_quarters, oil_engine1, oil_engine2, notes, created_at

## Business Rules
- Aircraft: Baron 58, 4X-DZJ, 166 gallons fuel capacity
- Instructor: שני שגיב (also co-manager/admin)
- Admin names: Din, שני שגיב — password: BaronAdmin
- Booking colors: blue = with instructor, yellow = without instructor
- Post-flight submission: up to 7 days after flight
- Post-flight editing: up to 1 hour after submission (then admin only)
- Clicking booking in calendar → goes to post-flight form (if within time window)

## Environment Variables (.env.local + Vercel)
- NEXT_PUBLIC_SUPABASE_URL=https://wqethdnkquhfxjelwtqw.supabase.co
- SUPABASE_SERVICE_ROLE_KEY=set in Vercel
- ADMIN_NAME=Din
- ADMIN_PASSWORD=BaronAdmin
- WHATSAPP_NOTIFY_NUMBER=972526525524

## Development Workflow
- tmux session: baron
- Always run Claude Code inside tmux 'baron' session
- Deploy: git add -A && git commit -m "..." && npx vercel --prod --yes
- Never edit files manually when Claude Code is available

## Pending / Ideas
- Google Calendar sync (API ready, needs credentials)
- WhatsApp approval flow (notify on booking)
- Engine hours tracking
- Maintenance log

## ⚠️ Quality Rules — MUST FOLLOW

### Before Every Deploy
1. Run `npm run build` — MUST pass with 0 errors
2. Run `npm run dev` and verify changed pages load correctly
3. Test edge cases: empty fields, invalid dates, overlapping bookings
4. Check mobile responsiveness on changed pages

### Code Quality
- Always validate user input (server-side, not just client)
- Handle API errors gracefully — show Hebrew error messages to user
- Never leave console.log in production code
- Use TypeScript types strictly — no `any` types
- RTL support: use logical properties (start/end, not left/right)

### Testing Checklist (per feature)
- [ ] Happy path works
- [ ] Empty/missing fields handled
- [ ] Duplicate/conflicting data handled
- [ ] Mobile view looks correct
- [ ] Hebrew text displays correctly (RTL)
- [ ] Admin panel reflects changes
- [ ] API returns proper error codes

### Self Code Review
Before committing, review your own changes:
- Are there security issues? (exposed keys, missing auth checks)
- Are there performance issues? (unnecessary re-renders, missing loading states)
- Is the UI consistent with existing pages?
- Would a pilot understand how to use this on their phone?

### Change Summary Rule
Before every commit, output a summary:
1. **What changed** — list of files and what was modified
2. **Why** — the reason for each change
3. **What could break** — potential side effects or regressions
4. **How I verified** — what tests/checks were run
