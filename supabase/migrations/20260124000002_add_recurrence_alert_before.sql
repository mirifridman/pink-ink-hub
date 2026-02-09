-- Add recurrence_alert_before field to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS recurrence_alert_before TEXT CHECK (recurrence_alert_before IN ('none', 'day', 'week', 'two_weeks', 'month'));

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.recurrence_alert_before IS 'When to alert before recurring task: none, day, week, two_weeks, month';
