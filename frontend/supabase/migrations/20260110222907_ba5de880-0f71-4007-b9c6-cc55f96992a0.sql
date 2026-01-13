-- Add target_user_id column to reminders table for team reminders
ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES auth.users(id);

-- Add is_personal column to identify personal reminders (self-reminders)
ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS is_personal boolean DEFAULT false;

-- Add reminder title for personal/team reminders
ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS title text;

-- Insert new permission for sending reminders to other users
INSERT INTO public.role_permissions (role, permission_key, is_allowed)
SELECT role, 'send_team_reminders', 
  CASE 
    WHEN role IN ('admin', 'editor') THEN true 
    ELSE false 
  END
FROM (VALUES ('admin'), ('editor'), ('designer'), ('publisher'), ('social')) AS roles(role)
ON CONFLICT (role, permission_key) DO NOTHING;

-- Update RLS policy for reminders to allow users to see their target reminders
CREATE POLICY "Users can view reminders targeted to them"
ON public.reminders
FOR SELECT
USING (auth.uid() = target_user_id);

-- Update RLS policy for reminders to allow creating team reminders
CREATE POLICY "Authenticated users can create reminders"
ON public.reminders
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);