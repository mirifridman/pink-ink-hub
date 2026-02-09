-- Add recurrence fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS recurrence_start_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_last_created DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.recurrence_type IS 'Type of recurrence: daily, weekly, monthly, yearly';
COMMENT ON COLUMN public.tasks.recurrence_start_date IS 'Start date for the recurrence pattern';
COMMENT ON COLUMN public.tasks.recurrence_end_date IS 'Optional end date for the recurrence pattern (NULL means no end)';
COMMENT ON COLUMN public.tasks.recurrence_last_created IS 'Date when the last recurring task instance was created';
