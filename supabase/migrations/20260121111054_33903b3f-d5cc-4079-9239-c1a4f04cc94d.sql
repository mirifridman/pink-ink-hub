-- Create emails table for Email Center
CREATE TABLE public.emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE,
  sender_name TEXT NOT NULL,
  sender_address TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'archived')),
  attachment_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "emails_select_authenticated" 
ON public.emails 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "emails_insert_service" 
ON public.emails 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "emails_update_editors" 
ON public.emails 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "emails_delete_admin" 
ON public.emails 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create index for faster queries
CREATE INDEX idx_emails_status ON public.emails(status);
CREATE INDEX idx_emails_received_at ON public.emails(received_at DESC);