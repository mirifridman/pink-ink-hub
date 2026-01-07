-- שינוי 1: חודש עברי לגיליונות
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS hebrew_month TEXT;

-- שינוי 2: תפקיד חדש - social (צוות סושיאל/דיגיטל)
-- נעדכן את ה-enum להוסיף את התפקיד החדש
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'social';

-- שינוי 3: טבלת הערות לליינאפ
CREATE TABLE IF NOT EXISTS public.lineup_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lineup_item_id UUID REFERENCES public.lineup_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.lineup_comments ENABLE ROW LEVEL SECURITY;

-- Policies for lineup_comments
CREATE POLICY "Authenticated users can view lineup comments"
ON public.lineup_comments
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create comments"
ON public.lineup_comments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own comments"
ON public.lineup_comments
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
ON public.lineup_comments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lineup_comments_lineup_item_id ON public.lineup_comments(lineup_item_id);
CREATE INDEX IF NOT EXISTS idx_lineup_comments_created_at ON public.lineup_comments(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_lineup_comments_updated_at
BEFORE UPDATE ON public.lineup_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();