# הוראות התקנה - מערכת מיילים אוטומטית

## שלב 1: הגדרת Resend API Key ב-Supabase

1. היכנס ל-Supabase Dashboard
2. לך ל-**Project Settings** > **Edge Functions**
3. לחץ על **Manage Secrets**
4. הוסף סוד חדש:
   - **Name:** `RESEND_API_KEY`
   - **Value:** ה-API Key שלך מ-Resend

## שלב 2: יצירת טבלת email_queue

1. היכנס ל-Supabase Dashboard
2. לך ל-**SQL Editor**
3. הדבק את תוכן הקובץ `01_email_queue_table.sql`
4. לחץ **Run**

## שלב 3: יצירת Edge Function - send-email

1. היכנס ל-Supabase Dashboard
2. לך ל-**Edge Functions**
3. לחץ **Create a new function**
4. שם הפונקציה: `send-email`
5. הדבק את תוכן `02_edge_function_send_email.ts`
6. **חשוב:** עדכן את ה-`from` email לדומיין שלך!
7. לחץ **Deploy**

## שלב 4: יצירת Edge Function - check-deadlines (אופציונלי)

1. לך ל-**Edge Functions**
2. לחץ **Create a new function**
3. שם הפונקציה: `check-deadlines`
4. הדבק את תוכן `03_edge_function_check_deadlines.ts`
5. לחץ **Deploy**

## שלב 5: הגדרת CRON Job (אופציונלי)

כדי להפעיל את ה-check-deadlines אוטומטית:

1. לך ל-**Database** > **Extensions**
2. הפעל את `pg_cron` אם לא מופעל
3. ב-SQL Editor, הרץ:

```sql
-- הפעלת CRON לבדיקת דדליינים כל יום ב-8:00 בבוקר
SELECT cron.schedule(
  'check-deadlines-daily',
  '0 8 * * *',  -- כל יום ב-8:00
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-deadlines',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

## בדיקה

1. היכנס לאפליקציה
2. לך ל-**/emails** (רק למנהלים)
3. בטאב "בדיקה" - שלח מייל בדיקה
4. בדוק שהמייל הגיע

## אינטגרציה בקוד

לשליחת מייל מהקוד, השתמש ב-hook:

```tsx
import { useEmail } from '@/hooks/useEmail';

const MyComponent = () => {
  const { sendDeadlineReminder, sendTestEmail, isSending } = useEmail();

  const handleSendReminder = async () => {
    await sendDeadlineReminder('user@example.com', {
      editorName: 'ישראל',
      issueName: 'גיליון 42',
      contentItems: [{ title: 'כתבה ראשית', pages: '1-4' }],
      deadline: '2024-02-01',
      daysLeft: 3
    });
  };

  return (
    <button onClick={handleSendReminder} disabled={isSending}>
      שלח תזכורת
    </button>
  );
};
```

## תבניות זמינות

- `deadlineReminderTemplate` - תזכורת דדליין
- `contentUploadedTemplate` - אישור העלאת תוכן
- `newIssueTemplate` - הודעה על גיליון חדש
- `assignmentSentTemplate` - הקצאת משימה
- `weeklyReportTemplate` - דו"ח שבועי
- `generalReminderTemplate` - תזכורת כללית
- `testEmailTemplate` - מייל בדיקה
