# תיק חניך דיגיטלי — Baron Scheduler

## המשימה
בנה מודול "תיק חניך דיגיטלי" (Digital Student Portfolio) לקורס הגדר קבוצה ב' על הבארון.

---

## 1. DB — טבלאות חדשות + שינוי קיים

### שינוי בטבלת pilots (D1 migration)
```sql
ALTER TABLE pilots ADD COLUMN twin_engine_status TEXT DEFAULT 'none';
-- ערכים: 'none' | 'cadet' | 'licensed'
```

### טבלה חדשה: cadet_lesson_records
```sql
CREATE TABLE IF NOT EXISTS cadet_lesson_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  pilot_name TEXT NOT NULL,
  booking_id TEXT,
  flight_log_id TEXT,
  lesson_type TEXT NOT NULL,         -- 'briefing' | 'flight'
  lesson_number INTEGER NOT NULL,    -- briefing: 1-4, flight: 1-8
  lesson_attempt INTEGER DEFAULT 1,  -- שיעורים יכולים לחזור
  lesson_status TEXT DEFAULT 'U',    -- 'S' | 'U' | 'I'
  instructor_name TEXT,
  instructor_license TEXT,
  notes TEXT,
  submitted_by TEXT,                 -- 'cadet' | 'instructor'
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### טבלה חדשה: cadet_lesson_exercises
```sql
CREATE TABLE IF NOT EXISTS cadet_lesson_exercises (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  lesson_record_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  grade TEXT NOT NULL,   -- '1' | '2' | '3' | '4' | '5' | 'D'
  created_at TEXT DEFAULT (datetime('now'))
);
```

**הרץ את ה-migrations על D1:**
```bash
npx wrangler d1 execute baron-scheduler-db --remote --command "ALTER TABLE pilots ADD COLUMN twin_engine_status TEXT DEFAULT 'none'"
npx wrangler d1 execute baron-scheduler-db --remote --command "CREATE TABLE IF NOT EXISTS cadet_lesson_records (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), pilot_name TEXT NOT NULL, booking_id TEXT, flight_log_id TEXT, lesson_type TEXT NOT NULL, lesson_number INTEGER NOT NULL, lesson_attempt INTEGER DEFAULT 1, lesson_status TEXT DEFAULT 'U', instructor_name TEXT, instructor_license TEXT, notes TEXT, submitted_by TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))"
npx wrangler d1 execute baron-scheduler-db --remote --command "CREATE TABLE IF NOT EXISTS cadet_lesson_exercises (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), lesson_record_id TEXT NOT NULL, exercise_name TEXT NOT NULL, grade TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))"
```

גם עדכן את schema.sql בהתאם.

---

## 2. מבנה תכנית ההדרכה (קבוע בקוד)

צור קובץ `src/lib/cadet-curriculum.ts` עם:

```typescript
export type LessonType = 'briefing' | 'flight'

export interface CurriculumLesson {
  type: LessonType
  number: number
  title: string
  durationHours: number
  instrumentHours?: number
  exercises: string[]
}

export const CURRICULUM: CurriculumLesson[] = [
  {
    type: 'briefing',
    number: 1,
    title: 'היכרות עם מערכות כלי הטיס',
    durationHours: 1.5,
    exercises: [
      'מבנה גוף ורכיבים עיקריים',
      'תא הטייס ולוח המכשירים',
      'שילדת המטוס וגלגלים',
      'מערכות היגוי',
      'המנוע ופרופלור',
      'מערכת דלק',
      'מכשירי המטוס ואוויוניקה',
    ]
  },
  {
    type: 'briefing',
    number: 2,
    title: 'מערכות, ביצועים ומגבלות',
    durationHours: 1.5,
    exercises: [
      'מערכת חשמל',
      'מערכות תקשורת והכוונה',
      'מערכות שרות (חימום, חירום, הידראולי)',
      'ביצועים ומגבלות',
      'תכנון טיסה — משקל, דלק, מזג אוויר',
    ]
  },
  {
    type: 'briefing',
    number: 3,
    title: 'אלמנטים בסיסיים בהפעלת אווירון רב מנועי',
    durationHours: 2.0,
    exercises: [
      'נהלים רגילים — בדיקות והתנעה',
      'נהלים רגילים — המראה ונחיתה',
      'מהירויות ייחודיות (VMCa, VMCg, VYSE, VXSE, VSSE)',
      'תרגיל DEMO VMC',
      'נהלי חירום ותקלות',
      'הפסקת המראה ונחיתות אונס',
      'ניהול סיכונים ובטיחות',
    ]
  },
  {
    type: 'briefing',
    number: 4,
    title: 'ניווט',
    durationHours: 1.0,
    exercises: [
      'שיטות ניווט (pilotage, dead reckoning)',
      'הכנות לטיסת ניווט',
      'קריאת מפות CVFR',
      'שיקולי מזג אוויר ו-NOTAMs',
      'חישובי דלק וזמן',
      'הגשת תוכנית טיסה',
      'שיטות עבודה בטיסת ניווט',
    ]
  },
  {
    type: 'flight',
    number: 1,
    title: 'מצבי טיסה, מעברים, פניות, הזדקרויות',
    durationHours: 0.8,
    exercises: [
      'הכנת כלי הטיס לטיסה',
      'ביצוע בד"ח',
      'התנעה ובדיקות',
      'הסעה ושימוש במעצורים',
      'המראה רגילה / רוח צד',
      'מעברים',
      'פניות בינוניות וחדות',
      'שינוי מהירות',
      'טיסה במהירות איטית',
      'הנמכה וגלישה',
      'הזדקרות חלקית (ישר ובפניה)',
      'תרגול VMC DEMO',
      'הצטרפות להקפה',
      'הליכה סביב',
      'נחיתה רגילה / רוח צד',
      'כיבוי, חנייה ורישום בספר מטוס',
    ]
  },
  {
    type: 'flight',
    number: 2,
    title: 'מצבי טיסה, מעברים, פניות, הזדקרויות',
    durationHours: 0.7,
    exercises: [
      'הכנת כלי הטיס לטיסה',
      'ביצוע בד"ח',
      'התנעה ובדיקות',
      'הסעה',
      'המראה רגילה / רוח צד',
      'מעברים',
      'פניות בינוניות וחדות',
      'שינוי מהירות',
      'טיסה במהירות איטית',
      'הזדקרויות חלקיות',
      'הנמכה וגלישה',
      'תרגול VMC DEMO',
      'הצטרפות להקפה',
      'הליכה סביב',
      'נחיתה רגילה / רוח צד',
      'כיבוי, חנייה ורישום בספר מטוס',
    ]
  },
  {
    type: 'flight',
    number: 3,
    title: 'הכרות עם תפעול מצבים חריגים וחרומים',
    durationHours: 0.8,
    exercises: [
      'הכנת כלי הטיס לטיסה',
      'ביצוע בד"ח',
      'התנעה ובדיקות',
      'הסעה',
      'המראה רגילה',
      'הפסקת המראה',
      'דימוי אובדן לחץ שמן',
      'שיוט באובדן מנוע — הנצה וכיבוי אבטוח',
      'שיוט עם מנוע אחד כבוי',
      'התנעה באוויר וחזרה לשיוט',
      'דימוי מנוע באש',
      'דימוי אש חשמלית',
      'דימוי אש בתא / בכנף',
      'הנמכת חרום',
      'תפעול גלגלים בחירום',
      'דימוי תקלת חשמל כללית',
      'דימוי תקלת קשר',
      'הצטרפות להקפה',
      'נחיתה רגילה',
      'כיבוי, חנייה ורישום בספר מטוס',
    ]
  },
  {
    type: 'flight',
    number: 4,
    title: 'תפעול מצבים חריגים וחרומים',
    durationHours: 0.7,
    exercises: [
      'הכנת כלי הטיס לטיסה',
      'ביצוע בד"ח',
      'התנעה ובדיקות',
      'הסעה',
      'המראה רגילה',
      'הפסקת המראה',
      'דימוי תקלה במערכת הדלק',
      'שיוט באובדן מנוע — הנצה וכיבוי/אבטוח',
      'שיוט עם מנוע אחד כבוי',
      'התנעה באוויר וחזרה לשיוט',
      'דימוי מנוע באש',
      'דימוי אש בתא / בכנף',
      'הנמכת חרום',
      'תפעול גלגלים בחירום',
      'דימוי תקלת חשמל כללית',
      'דימוי תקלת קשר',
      'הצטרפות להקפה',
      'נחיתה ללא מדפים',
      'כיבוי, חנייה ורישום בספר מטוס',
    ]
  },
  {
    type: 'flight',
    number: 5,
    title: 'הקפות באווירון רב מנועי',
    durationHours: 1.0,
    exercises: [
      'הכנת כלי הטיס לטיסה',
      'ביצוע בד"ח',
      'התנעה ובדיקות',
      'דימוי אש בעת הסעה',
      'המראות רגילות / רוח צד',
      'דימוי אובדן מנוע בהמראה',
      'המראה קצרה',
      'הקפות',
      'נחיתות רגילות / רוח צד',
      'הליכה סביב (שני מנועים)',
      'דימוי חרומים בהקפה',
      'נחיתה עם מנוע אחד (עם ובלי רוח צד)',
      'נחיתה קצרה',
      'כיבוי, חנייה ורישום בספר מטוס',
    ]
  },
  {
    type: 'flight',
    number: 6,
    title: 'טיסת ניווט בנתיבי התובלה הנמוכים',
    durationHours: 2.5,
    instrumentHours: 0.5,
    exercises: [
      'הכנת כלי הטיס לטיסה',
      'ביצוע בד"ח',
      'התנעה ובדיקות',
      'המראה',
      'ניווט בנתיבי CVFR',
      'זיהוי נקודות ציון',
      'תיקוני סחיפה וזמן',
      'שיוט מכשירים',
      'תקשורת בנתיב',
      'הצטרפות להקפה',
      'נחיתה',
      'כיבוי, חנייה ורישום בספר מטוס',
    ]
  },
  {
    type: 'flight',
    number: 7,
    title: 'ניווט והקפות לילה',
    durationHours: 2.5,
    instrumentHours: 0.5,
    exercises: [
      'הכנת כלי הטיס לטיסה',
      'ביצוע בד"ח לילה',
      'התנעה ובדיקות',
      'המראת לילה',
      'ניווט לילה',
      'הקפות לילה',
      'שיוט מכשירים לילה',
      'נחיתת לילה',
      'כיבוי, חנייה ורישום בספר מטוס',
    ]
  },
  {
    type: 'flight',
    number: 8,
    title: 'חזרה והכנה למבחן',
    durationHours: 1.0,
    exercises: [
      'הכנת כלי הטיס לטיסה',
      'ביצוע בד"ח',
      'התנעה ובדיקות',
      'חזרה על מצבי טיסה בסיסיים',
      'חזרה על חרומים ותקלות',
      'חזרה על הקפות',
      'חזרה על ניווט',
      'תרגול VMC DEMO',
      'הצטרפות להקפה',
      'נחיתה',
      'כיבוי, חנייה ורישום בספר מטוס',
    ]
  },
]

export const BRIEFINGS = CURRICULUM.filter(l => l.type === 'briefing')
export const FLIGHT_LESSONS = CURRICULUM.filter(l => l.type === 'flight')

export const GRADE_OPTIONS = [
  { value: '1', label: '1 — מצוין' },
  { value: '2', label: '2 — מעל ממוצע' },
  { value: '3', label: '3 — ממוצע' },
  { value: '4', label: '4 — מתחת לממוצע' },
  { value: '5', label: '5 — מתחת לסטנדרטים' },
  { value: 'D', label: 'D — הדגמה בלבד' },
]

export const STATUS_OPTIONS = [
  { value: 'S', label: 'S — Satisfactory' },
  { value: 'U', label: 'U — Unsatisfactory' },
  { value: 'I', label: 'I — Incomplete' },
]
```

---

## 3. API Routes

### עדכון `/api/pilots/route.ts`
הוסף `twin_engine_status` ל-POST וגם צור PUT/PATCH לעדכון.

### עדכון `/api/pilots/[id]/route.ts`
הוסף PATCH endpoint לעדכון `twin_engine_status`:
```typescript
export async function PATCH(request, { params }) {
  const body = await request.json()
  const { twin_engine_status } = body
  // validate: 'none' | 'cadet' | 'licensed'
  await dbRun('UPDATE pilots SET twin_engine_status = ? WHERE id = ?', twin_engine_status, params.id)
  return NextResponse.json({ success: true })
}
```

### חדש: `/api/cadet-records/route.ts`
```
GET /api/cadet-records?pilot_name=X   → כל הרשומות של חניך
POST /api/cadet-records               → יצירת רשומה חדשה
```

### חדש: `/api/cadet-records/[id]/route.ts`
```
GET /api/cadet-records/[id]           → רשומה ספציפית
PUT /api/cadet-records/[id]           → עדכון רשומה
```

### חדש: `/api/pilots/check-status/route.ts`
```
GET /api/pilots/check-status?name=X  → מחזיר { twin_engine_status }
```
(בשימוש ב-PostFlightForm)

---

## 4. עדכון PostFlightForm

**לאחר שליחת הטופס בהצלחה (step = 'done')**, לפני שמוצג "הדיווח נשלח":

1. בדוק `twin_engine_status` של הטייס דרך `/api/pilots/check-status?name=<pilotName>`
2. אם `cadet`:
   - **אל תציג "הדיווח נשלח" עדיין**
   - הצג שלב נוסף: `CadetLessonForm` (קומפוננט נפרד)
   - כאשר CadetLessonForm מסיים → הצג "הדיווח נשלח" כרגיל
3. אם `licensed` או `none` → התנהגות רגילה, אין שינוי

**הוסף step חדש לטיפוסי Step:**
```typescript
type Step = 'name' | 'select' | 'form' | 'cadet' | 'done'
```

---

## 5. קומפוננט CadetLessonForm (src/components/CadetLessonForm.tsx)

קומפוננט שמוצג לאחר סגירת הטיסה לחניך.

### Props
```typescript
interface CadetLessonFormProps {
  pilotName: string
  bookingId: string
  flightLogId: string
  onComplete: () => void  // קורא לזה אחרי שמירה (או דילוג)
}
```

### ממשק המשתמש
1. **כותרת**: "מילוי תיק חניך" עם הסבר קצר
2. **בחירת סוג**: תדריך כיתתי / שיעור טיסה (radio/tabs)
3. **בחירת שיעור**: dropdown עם רשימת השיעורים מה-curriculum
4. **אם שיעור טיסה — שאל**: "האם חזרת על שיעור שכבר עשית?" (כן/לא → מגדיר lesson_attempt)
5. **רשימת תרגילים**: כרטיסים עם שם תרגיל + dropdown לציון (1-5, D)
6. **ציון כולל לשיעור**: S / U / I
7. **שם מדריך + מספר רישיון**: שדות טקסט (שני שגיב + 936 כ-default)
8. **הערות**: textarea אופציונלי
9. **כפתורים**: "שמור" | "דלג (המדריך ישלים)"

### לוגיקה בלחיצה על "שמור"
POST /api/cadet-records עם:
```json
{
  "pilot_name": "...",
  "booking_id": "...",
  "flight_log_id": "...",
  "lesson_type": "briefing" | "flight",
  "lesson_number": 1,
  "lesson_attempt": 1,
  "lesson_status": "S" | "U" | "I",
  "instructor_name": "שני שגיב",
  "instructor_license": "936",
  "notes": "...",
  "submitted_by": "cadet",
  "exercises": [
    { "exercise_name": "...", "grade": "3" }
  ]
}
```

---

## 6. דף תיק חניך (src/app/cadet/[name]/page.tsx)

### נגישות
- כל משתמש (כל טייס, מדריך, אדמין) יכול לגשת — אין auth מיוחד
- URL: `/cadet/[שם-החניך-מ-URL-encoding]`

### מה מוצג
1. **כותרת + שם חניך**
2. **לוח בקרה (Progress dashboard)**:
   - תדריכים: X/4 הושלמו (S)
   - שיעורים: X/8 הושלמו (S)
   - שעות טיסה שנצברו (סכום hobbs_end - hobbs_start מ-flight_logs) vs. יעד 10 שעות
   - שעות תדריך: X/6 שעות
3. **רשימת תדריכים כיתתיים** (4 תדריכים):
   - כל אחד: מספר, שם, ציון (S/U/I), תאריך, מדריך
   - אם לא הושלם → badge "לא הושלם"
4. **רשימת שיעורי טיסה** (כל הנסיונות):
   - כל אחד: שם שיעור, ניסיון מספר X, ציון, תאריך, קישור לטיסה
5. **לחצן "ייצוא PDF"** (פתוח `/cadet/[name]/pdf`)

### קישור מדף פרופיל הטייס
בדף הטייס (`/admin/pilots` או דף פרופיל), הוסף:
- שדה `twin_engine_status` עם dropdown לעדכון
- אם cadet → link "תיק חניך" לדף `/cadet/[name]`

---

## 7. ייצוא PDF

### דף: `/cadet/[name]/pdf/page.tsx`

השתמש ב-HTML פשוט (server-side rendered) שניתן להדפסה, עם `@media print` CSS. לא צריך ספרייה חיצונית.

**עיצוב הדף**:
- כותרת "תיק חניך דיגיטלי — הגדר אווירון קבוצה ב'"
- פרטי חניך ומדריך
- טבלת תדריכים
- טבלת שיעורי טיסה עם ציוני תרגילים
- סיכום שעות
- כפתור "הדפס" (מוסתר בהדפסה)

---

## 8. עדכון Admin — ניהול מצב חניך

בדף `/admin/pilots` (או דף עריכת פרופיל):
- הוסף שדה "סטטוס הגדר דו מנועי" עם 3 אפשרויות:
  - `none` — "אין"
  - `cadet` — "חניך לרישיון קבוצה ב'"
  - `licensed` — "בעל רישיון קבוצה ב'"
- שמור עם PATCH `/api/pilots/[id]`

---

## 9. עדכון schema.sql
הוסף את השינויים לסוף הקובץ:
```sql
ALTER TABLE pilots ADD COLUMN twin_engine_status TEXT DEFAULT 'none';

CREATE TABLE IF NOT EXISTS cadet_lesson_records ( ... );
CREATE TABLE IF NOT EXISTS cadet_lesson_exercises ( ... );
```

---

## 10. עדכון db.ts — types
```typescript
export type CadetLessonRecord = {
  id: string; pilot_name: string; booking_id: string|null;
  flight_log_id: string|null; lesson_type: string; lesson_number: number;
  lesson_attempt: number; lesson_status: string; instructor_name: string|null;
  instructor_license: string|null; notes: string|null; submitted_by: string|null;
  created_at: string; updated_at: string
}
export type CadetLessonExercise = {
  id: string; lesson_record_id: string; exercise_name: string;
  grade: string; created_at: string
}
```

---

## Design System

עקוב אחרי הסגנון הקיים:
- צבעי baron: `bg-baron-bg`, `text-baron-text`, `border-baron-border`
- כרטיסים: `card rounded-xl p-4`
- כפתורים ראשיים: `btn-primary`
- כל הטקסטים בעברית, RTL
- מובייל-first (375px)

---

## אחרי הכל

1. `npm run build` — חייב לעבור ללא שגיאות
2. `git add -A && git commit -m "feat: תיק חניך דיגיטלי — digital student portfolio for twin-engine license"`
3. `git push`
4. הרץ: `openclaw system event --text "Done: תיק חניך דיגיטלי הושלם — build עבר, ממתין לאישור QA" --mode now`

**אל תדפלוי לproduction עדיין — ClawBot צריך לאשר.**
