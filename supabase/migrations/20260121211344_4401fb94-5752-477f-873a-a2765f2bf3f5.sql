-- Create table for storing email replies without FK (will be managed in application logic)
CREATE TABLE public.email_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID NOT NULL,
  reply_text TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_replies ENABLE ROW LEVEL SECURITY;

-- Policies for email replies
CREATE POLICY "Admins and editors can view email replies"
  ON public.email_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can insert email replies"
  ON public.email_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can delete email replies"
  ON public.email_replies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Create index for efficient lookups
CREATE INDEX idx_email_replies_email_id ON public.email_replies(email_id);
CREATE INDEX idx_email_replies_sent_at ON public.email_replies(sent_at DESC);