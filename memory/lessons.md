# Baron Scheduler — לקחים וסטטוס

## סטטוס נוכחי
- **Production**: https://baron-scheduler.pages.dev (Cloudflare Pages)
- **Stack**: Next.js, D1 (מיגרציה מ-Supabase הושלמה), Tailwind CSS
- **עיצוב אחרון**: jet-luxury redesign (gold/red/white מ-4X-DZJ) — commit 3183ed3
- **מיגרציה ל-D1**: הושלמה, Supabase הוסר לחלוטין (commit 340c354)

## מה בוצע לאחרונה
- עיצוב מחדש: gold/red/white palette
- מעקב כניסות (login history + page views + rich logging)
- פורטל טייס: עריכה וביטול הזמנות
- זיהוי התנגשויות בזמן אמת + presets תחזוקה
- API caching — צמצום מ-6 בקשות ל-1
- Cloudflare Pages deploy + GitHub Actions auto-deploy
- בדיקות E2E + Lighthouse CI

## עיצוב v0 — לא שולב עדיין
- נוצר טופס הזמנה מעוצב ב-v0: https://v0.app/chat/flight-booking-form-jE6AtjEGvC6
- Hero section + כרטיסי info + טופס מודרני עם RTL
- **לא שולב בקוד** — העיצוב הנוכחי הוא jet-luxury
- דין רוצה לשדרג ל-v0 premium ולעצב את כל המסכים

## TODO
- [ ] עיצוב מחדש של כל המסכים דרך v0
- [ ] Google Calendar sync (API מוכן, חסר credentials)
- [ ] WhatsApp approval flow

## לקחים
- תמיד לתעד מה עשית ב-commit message ברור
- לפני deploy: build + בדיקת env vars
- מבחן הטייסים: "שני והטייסים יבינו תוך 3 שניות?"
- אחרי compacting הכל נמחק — תכתוב לקובץ הזה
