-- Create incoming_emails table for email-based tasks
CREATE TABLE public.incoming_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  subject TEXT NOT NULL,
  content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_processed BOOLEAN DEFAULT false,
  created_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incoming_emails ENABLE ROW LEVEL SECURITY;

-- Policies for incoming_emails
CREATE POLICY "incoming_emails_select_authenticated" 
ON public.incoming_emails 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "incoming_emails_insert_service" 
ON public.incoming_emails 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "incoming_emails_update_editors" 
ON public.incoming_emails 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "incoming_emails_delete_admin" 
ON public.incoming_emails 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Add index for performance
CREATE INDEX idx_incoming_emails_is_processed ON public.incoming_emails(is_processed);
CREATE INDEX idx_incoming_emails_sent_at ON public.incoming_emails(sent_at DESC);