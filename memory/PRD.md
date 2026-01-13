# מגזין פרו - מערכת ניהול הפקה

## סקירה כללית
מערכת לניהול הפקת מגזינים עם ממשק עברי מלא. המערכת מאפשרת ניהול גיליונות, ליינאפ, ספקים, תקציבים, תזכורות וצוות עבודה.

## טכנולוגיות
- **Frontend**: React + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Query (@tanstack/react-query)

## מבנה הדאטהבייס (Supabase)

### טבלאות עיקריות:
1. **magazines** - מגזינים
2. **issues** - גיליונות
3. **lineup_items** - פריטים בליינאפ
4. **inserts** - אינסרטים
5. **suppliers** - ספקים
6. **budget_items** - פריטי תקציב
7. **reminders** - תזכורות
8. **profiles** - פרופילי משתמשים
9. **user_roles** - תפקידי משתמשים

### תפקידים (Roles):
- admin
- editor
- designer
- publisher
- social

## דפים ופיצ'רים

### 1. דף התחברות (/auth)
- התחברות עם אימייל וסיסמה
- הרשמה למשתמשים חדשים
- תמיכה ב-Magic Link

### 2. דשבורד (/)
- ברכת זמן (בוקר/ערב/לילה/שבוע טוב)
- כרטיס פריטים דחופים
- גיליונות פעילים
- התראות מערכת
- תזכורות צוות

### 3. גיליונות (/issues)
- יצירת גיליון חדש
- ניהול סטטוס
- תאריכי הפקה

### 4. ליינאפ (/lineup)
- ניהול פריטי תוכן
- סטטוס עיצוב
- הקצאת עמודים

### 5. ספקים (/suppliers)
- ניהול ספקים
- פרטי קשר
- סוג ספק

### 6. צוות (/team)
- צפייה בחברי צוות
- ניהול הרשאות

### 7. תזכורות (/reminders)
- יצירת תזכורות
- מעקב סטטוס

### 8. הגדרות (/settings) - Admin בלבד
- הגדרות מערכת
- תבניות עמודים

### 9. משתמשים (/users) - Admin בלבד
- ניהול משתמשים
- הזמנת משתמשים חדשים

### 10. הרשאות (/permissions) - Admin בלבד
- ניהול הרשאות לפי תפקיד

## Supabase Configuration
- Project URL: https://iuqozixibieeuatiyyfg.supabase.co
- Row Level Security (RLS) מופעל על כל הטבלאות
- Triggers לעדכון תאריכים אוטומטי

## סטטוס נוכחי
✅ Frontend מוגדר ורץ
✅ Supabase מחובר
✅ Authentication מוגדר
✅ כל הדפים קיימים
✅ טיפוסים מסונכרנים עם Supabase
