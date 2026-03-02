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

## 🔴 MANDATORY — Browser Testing After Every Change

You MUST test every change through the browser. No exceptions. No skipping.

### How to test
1. Start dev server: `npm run dev`
2. Use Playwright's browser to navigate to http://localhost:3000
3. Actually interact with the UI — click buttons, fill forms, navigate pages
4. Take screenshots of what you see to verify layout and design

### What to test (every time)
- Open the page you changed — does it load? does it look right?
- Fill forms with VALID data — does it submit correctly?
- Fill forms with INVALID data — empty fields, wrong formats, past dates
- Click every button on the page — does each one work?
- Try the flow on mobile viewport (375px wide)
- Check Hebrew text is aligned correctly (RTL)
- Try double-clicking submit buttons — does it handle it?
- Navigate away and back — does state persist correctly?

### Test scenarios to try
- New booking: pick a date, time, pilot name → verify it appears in calendar
- Overlapping booking: try to book same time slot twice → should show error
- Post-flight form: enter Hobbs, fuel, oil → verify it saves
- Admin login: wrong password → error; correct password → success
- Fuel calculator: enter gallons → verify liters conversion is correct
- Empty form submission → should show validation errors
- Very long pilot name → should not break layout

### Proof of testing
After testing, include in your commit message:
```
Tested:
- [x] Page loads correctly (screenshot taken)
- [x] Form validation works (empty + invalid)
- [x] Happy path works (full flow)
- [x] Mobile viewport checked
- [x] RTL layout correct
```

### ❌ NEVER commit if:
- You haven't opened the app in a browser
- You haven't tried at least 3 different scenarios
- You haven't checked mobile viewport
- `npm run build` hasn't passed

## 📋 Development Standards

### Testing Discipline
- After every change — run `npm run build` and show me it passed
- Write a Playwright test for every new feature BEFORE moving on
- Test on mobile viewport (375px) — most users are on phones
- Test edge cases: empty fields, special characters, double-click on buttons

### Security
- Every API route MUST check permissions server-side — never trust the client
- Never expose keys or passwords in code
- Always validate input — even if there's form validation on the client

### UX Rules
- Every action that takes time → show loading state (spinner/skeleton)
- Every error → show a message IN HEBREW that a regular user would understand
- Every success → visual confirmation (toast / redirect / animation)
- Never break existing navigation when adding a new page
- Disable submit buttons after click to prevent double submission

### Code Standards
- No `console.log` left in production code — remove before commit
- No `any` in TypeScript — use proper types
- Functions shorter than 50 lines — split if longer
- Clear variable names in English
- Comments in English for complex logic

### Git Hygiene
- One commit per feature — not one giant commit with 20 changes
- Commit message format: `type: description` (feat/fix/refactor/test/chore)
- Commit message must describe WHAT and WHY

## 🧠 Planning & Thinking Process

### Plan Before Code
- If a task affects more than 2 files — write a plan FIRST
- List which files will change and why
- Identify potential side effects BEFORE making changes
- Only start coding after the plan makes sense

### Test-Driven Development
- Write the test BEFORE writing the feature code
- The test should fail first, then make it pass
- This ensures you actually understand what the feature should do

### Regression Tests
- When fixing a bug — write a test that reproduces the bug FIRST
- Then fix the bug and verify the test passes
- This prevents the same bug from coming back

## 🔒 Security Checklist (per change)
- [ ] No API keys, passwords, or secrets in code
- [ ] All user input is validated and sanitized server-side
- [ ] API routes check authorization (not just authentication)
- [ ] No SQL injection possible (use parameterized queries)
- [ ] Rate limiting on sensitive endpoints (login, booking)
- [ ] Error messages don't expose internal details to users

## 🧹 Before You Say "Done"
1. `npm run build` passes ✅
2. Opened the app in browser and tested the feature ✅
3. Tested at least 3 edge cases ✅
4. Checked mobile viewport (375px) ✅
5. No `console.log` left in code ✅
6. No TypeScript `any` types ✅
7. Commit message is clear and descriptive ✅

If ANY of these fail — you are NOT done. Fix it first.


## 🤖 QA Flow — ClawBot Reviews Your Work

You are the DEVELOPER. ClawBot (OpenClaw) is the QA TESTER.

### After every change:
1. Run `npm run build` — must pass
2. Commit your changes with a clear message
3. Push to GitHub
4. **STOP and notify**: send a message saying what you changed and what pages to test
5. **WAIT for ClawBot to approve** before deploying to production

### ClawBot will:
- Open the app in a real browser (mobile + desktop)
- Click through all changed pages
- Test forms with valid and invalid data
- Check RTL, Hebrew text, layout
- Take screenshots and verify design
- Test edge cases you might have missed
- Test security: access pages without permission, inject malicious input
- Run Lighthouse scan for performance and accessibility
- Run regression tests: verify old features still work after your change
- Produce a QA report: what passed, what failed, with screenshots
- Deploy to production ONLY after full approval

### If ClawBot finds issues:
- You will receive a list of bugs/issues to fix
- Fix them ALL, then notify again
- Repeat until ClawBot approves

### ❌ NEVER deploy to production without ClawBot approval
### ✅ ClawBot says "approved" → run `npx vercel --prod --yes`
