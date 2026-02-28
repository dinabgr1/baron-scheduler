# Task 2 - כלים + מחשבון דלק משופר

## שינויים נדרשים:

### 1. דף חדש: /tools (כלים)
צור `src/app/tools/page.tsx` עם:
- Header רגיל
- כותרת: "כלים"
- מחשבון הדלק המשופר (ראה למטה)
- pb-20 md:pb-6 לmobile

### 2. עדכן Header (src/components/Header.tsx)
הוסף "כלים" לניווט:
- Desktop nav: הוסף link לכלים עם 🔧 לפני "ניהול"
- Bottom mobile nav: החלף אחד מהפריטים ב-🔧 כלים → /tools
  - עדכן את הbottom nav ל-5 פריטים: ✈️ הזמנה | 📅 זמינות | 📝 דיווח | 🔧 כלים | ⚙️ ניהול

### 3. עדכן FuelCalculator (src/components/FuelCalculator.tsx)
שינויים:
- **"כמות רצויה"** - נשאר גלונים (ללא שינוי)
- **"כמות נוכחית"** - שנה מליטרים לבחירה בין:
  - רבעים (quarters): 4 כפתורים - ¼ | ½ | ¾ | מלא
  - גלונים: input מספרי

כך:
```
כמות נוכחית:
[שני toggle buttons: "רבעים" | "גלונים"]

אם רבעים נבחר:
  4 כפתורים: [¼] [½] [¾] [מלא]
  
אם גלונים נבחר:
  input מספרי (כמו עכשיו אבל בגלונים, לא ליטרים)
```

הממשק:
- רבעים: ¼ = 41.5 גלון, ½ = 83 גלון, ¾ = 124.5 גלון, מלא = 166 גלון
- גלונים: input רגיל

החישוב: desiredGallons - currentGallons = gallons to add → convert to liters for display
התוצאה מציגה: "יש להוסיף: X ליטר (Y גלונים)"

### 4. הסר FuelCalculator מ-PostFlightForm
ב-src/components/PostFlightForm.tsx - הסר את import ו-render של FuelCalculator (הוא עבר לדף כלים)

### 5. After all changes:
npm run build
fix any errors
git add -A && git commit -m "Add tools page + improved fuel calculator with quarters/gallons"
npx vercel --prod --yes
openclaw system event --text "Tools page deployed" --mode now
