-- Create junction table for issue editors
CREATE TABLE public.issue_editors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  editor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(issue_id, editor_id)
);

-- Enable RLS
ALTER TABLE public.issue_editors ENABLE ROW LEVEL SECURITY;

-- RLS policies for issue_editors
CREATE POLICY "Authenticated users can view issue editors"
ON public.issue_editors FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can manage issue editors"
ON public.issue_editors FOR ALL
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can manage issue editors"
ON public.issue_editors FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add responsible_editor_id to lineup_items
ALTER TABLE public.lineup_items
ADD COLUMN responsible_editor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add responsible_editor_id to inserts
ALTER TABLE public.inserts
ADD COLUMN responsible_editor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;