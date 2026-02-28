# Baron Scheduler - Project Context

## About
Web app for scheduling flights on Beechcraft Baron 58, registration 4X-DZJ.

## Live URL
https://baron-scheduler.vercel.app

## Tech Stack
- Next.js 14 (App Router)
- Supabase (DB): project wqethdnkquhfxjelwtqw
- Vercel (hosting)
- Tailwind CSS

## Key Files
- src/components/WeeklyCalendar.tsx — main calendar (Google Calendar style)
- src/components/BookingForm.tsx — booking form
- src/components/PostFlightForm.tsx — post-flight log
- src/app/admin/page.tsx — admin panel (password: BaronAdmin)
- src/app/availability/page.tsx — availability view

## Instructors
- שני שגיב (main instructor + co-manager)

## Admin
- Admin names: Din, שני שגיב
- Password: BaronAdmin

## Development
- tmux session: baron
- Always use Claude Code in tmux session 'baron' for code changes
- After changes: git add -A && git commit && npx vercel --prod --yes
