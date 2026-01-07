-- הוספת שדות חדשים לטבלת lineup_items
ALTER TABLE public.lineup_items 
ADD COLUMN IF NOT EXISTS assignment_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assignment_sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assignment_sent_by UUID;

-- הוספת שדות חדשים לטבלת reminders
ALTER TABLE public.reminders 
ADD COLUMN IF NOT EXISTS content_received BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS content_received_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- הוספת שדות דומים לטבלת inserts
ALTER TABLE public.inserts 
ADD COLUMN IF NOT EXISTS assignment_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assignment_sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assignment_sent_by UUID;