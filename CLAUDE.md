# Baron Scheduler — Project Context

## ⚠️ First Thing Every Session
Read `memory/lessons.md` — contains current status, recent work, TODO, and lessons learned.
After compacting or new session, this file is your memory.
**Update it** when you complete tasks or learn something new.

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

## 🔧 כללי פיתוח

### לומד מטעויות
- אחרי תיקון מדין → עדכן memory/lessons.md
- כתוב כלל שמונע חזרה על אותה טעות
- קרא lessons.md בתחילת עבודה על הפרויקט
- שמור מתחת ל-60 שורות — מחק ישנים

### לא "סיימתי" בלי הוכחה
- בדוק בדפדפן: מובייל (375px) + דסקטופ
- הריץ את ה-flow מההתחלה לסוף כמשתמש חדש
- בדוק RTL, ניגודיות, מצבי קצה
- השווה התנהגות לפני/אחרי (diff מול main)
- ודא שלא שברת פיצ'רים קיימים
- בדוק production אחרי deploy, לא רק local
- בדוק logs — 500 בproduction = בושה
- מבחן המפתח: "הייתי מוציא את זה כמוצר שלי?"
- מבחן הטייסים: "שני והטייסים יבינו תוך 3 שניות?"

### תכנון
- משימה עם 3+ שלבים → תוכנית לפני ביצוע
- תכנן גם את שלבי הבדיקה, לא רק הבנייה
- תוכנית משתבשת → עצור, תכנן מחדש מיד
- subagents למחקר, ניתוח ומשימות מקבילות
- שמור context נקי — סשן חדש לכל נושא

### תיעוד וזיכרון
- לינקים, tokens, credentials → שמור מיד ב-MEMORY.md
- כל דבר לסשן הבא → כתוב לקובץ, לא "בראש"
- עדכן memory יומי בסוף עבודה משמעותית

### deployment
- בדוק env vars לפני deploy — חסר משתנה = אתר שבור
- ודא build עובר לפני push
- בדוק logs אחרי deploy
- אל תעשה deploy ותלך — חכה וודא שהכל חי

### git
- commits קטנים ותכופים עם הודעה ברורה
- שינוי גדול → branch נפרד, לא ישר ל-main
- לפני push: build + lint נקי

### לא שובר דברים
- שינוי API → בדוק כל מי שקורא לו
- שינוי DB schema → migration + בדיקת data קיים
- שינוי עיצוב → בדוק מסכים שהושפעו
- ספק → branch, לא main

### תקשורת
- משימה ארוכה → עדכן בהתקדמות, לא רק בסוף
- נתקעת → אמור מיד, לא 10 ניסיונות בשקט
- טעות → הודה, תקן, תעד

### חווית משתמש
- טייסים, לא מפתחים — פשטות מנצחת
- כל פעולה: feedback (loading, הצלחה, שגיאה)
- שגיאה → הודעה בעברית, לא "500 Error"
- פעולה מסוכנת → אישור לפני
- מצב ריק → מסך יפה, לא שגיאה
- אל תסתיר מידע מאחורי קליקים מיותרים

### ביצועים
- טעינה מעל 3 שניות = בעיה
- תמונות דחוסות + lazy loading
- לא לטעון data מיותר
- חשוב על מובייל ב-4G

### עברית ו-RTL
- טקסט חדש → בדוק RTL
- טלפון/תאריך/מספרים → LTR בתוך RTL
- אייקונים בכיוון הנכון (חצים!)
- placeholder בעברית

### אבטחה
- לא לחשוף API keys בצד לקוח
- הרשאות בכל endpoint: מדריך ≠ טייס ≠ אדמין
- validate כל input בשרת

### טיפול בשגיאות
- כל API call → try/catch + הודעה למשתמש
- loading state לכל פעולה אסינכרונית
- timeout → הודעה ברורה, לא תקיעה

### מוכנות לכישלון
- DB לא זמין → הודעה, לא מסך לבן
- הזמנה כפולה → טפל ב-race condition
- deploy שבר → rollback תוך דקה

### נגישות
- כפתורים 44px מינימום למובייל
- ניגודיות טקסט מספקת
- focus states למקלדת
- תמונות עם alt text

### סדר עדיפויות
- באג production > פיצ'ר חדש
- משתמשים > יופי
- דבר אחד מושלם > שלושה חצי-מוכנים

### לא מסבכים
- הפתרון הפשוט שעובד = הנכון
- 100 שורות ברורות > 30 "חכמות"
- ספק אם צריך פיצ'ר? כנראה לא
- בדוק אם כבר קיים לפני שכותבים חדש
- בדוק אם אפשר בלי ספרייה נוספת

### גבולות
- לפני "תוסיף X": איפה זה ישב? מה ההשפעה?
- פיצ'ר גדול → פרק לשלבים עם ערך בכל שלב
- scope creep → "נסיים מה שהתחלנו קודם"

### קבצי הנחיות
- CLAUDE.md קצר — מקסימום 60 שורות
- לא כתוב מה שהקוד כבר אומר
- לא כללים מובנים ("כתוב קוד נקי")
- נקה ועדכן מדי פעם

## 🤖 QA Flow — ClawBot Reviews Your Work

You are the DEVELOPER. ClawBot (OpenClaw) is the QA TESTER.

### After every change:
1. Run `npm run build` — must pass
2. Commit your changes with a clear message
3. Push to GitHub
4. **STOP and notify**: send a message saying what you changed and what pages to test
5. **WAIT for ClawBot to approve** before deploying to production

### ❌ NEVER deploy to production without ClawBot approval
