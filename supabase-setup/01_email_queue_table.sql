-- ============================================
-- EMAIL QUEUE TABLE AND TRIGGERS
-- Run this in Supabase SQL Editor
-- ============================================

-- Create email_queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage email queue" ON public.email_queue
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can view email queue" ON public.email_queue
  FOR SELECT USING (public.has_role(auth.uid(), 'editor'));

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at DESC);

-- Updated at trigger
CREATE TRIGGER update_email_queue_updated_at 
  BEFORE UPDATE ON public.email_queue 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- OPTIONAL: Auto-queue emails on content upload
-- ============================================

-- Trigger function for content uploaded notification
CREATE OR REPLACE FUNCTION notify_content_uploaded()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if text_ready or files_ready changed to true
  IF (NEW.text_ready = true AND OLD.text_ready = false) OR 
     (NEW.files_ready = true AND OLD.files_ready = false) THEN
    
    -- Queue email for responsible editor if exists
    IF NEW.responsible_editor_id IS NOT NULL THEN
      INSERT INTO public.email_queue (
        to_email, 
        subject, 
        template_name, 
        template_data
      )
      SELECT 
        p.email,
        'תוכן התקבל: ' || NEW.content,
        'content_uploaded',
        jsonb_build_object(
          'editorName', COALESCE(p.full_name, 'עורך'),
          'issueName', i.theme || ' #' || i.issue_number,
          'contentTitle', NEW.content,
          'contentType', COALESCE(NEW.content_type, 'לא מוגדר'),
          'pages', NEW.page_start || '-' || NEW.page_end
        )
      FROM public.profiles p
      JOIN public.issues i ON i.id = NEW.issue_id
      WHERE p.id = NEW.responsible_editor_id
        AND p.email IS NOT NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger (commented out - uncomment when ready)
-- CREATE TRIGGER content_uploaded_trigger
--   AFTER UPDATE ON public.lineup_items
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_content_uploaded();

-- ============================================
-- Add email preferences to user_preferences
-- ============================================

ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS email_notifications_types JSONB DEFAULT '{
  "deadline_reminders": true,
  "content_confirmations": true,
  "weekly_reports": false,
  "urgent_alerts": true,
  "new_issues": true,
  "assignment_notifications": true
}'::jsonb;
