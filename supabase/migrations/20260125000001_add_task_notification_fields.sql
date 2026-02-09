-- Add deadline_reminder_sent field to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS deadline_reminder_sent BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.tasks.deadline_reminder_sent IS 'Whether deadline reminder notification has been sent';
