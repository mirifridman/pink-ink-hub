-- Add recipient_id column to editor_messages table to allow selecting message recipient
ALTER TABLE public.editor_messages 
ADD COLUMN recipient_id uuid REFERENCES public.profiles(id);

-- Update table name is just a logical rename - we keep the same table
-- Update RLS policies to support messages to any team member

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all messages" ON public.editor_messages;
DROP POLICY IF EXISTS "Editors can update messages (mark as read)" ON public.editor_messages;
DROP POLICY IF EXISTS "Editors can view all messages" ON public.editor_messages;
DROP POLICY IF EXISTS "Publishers can create messages" ON public.editor_messages;
DROP POLICY IF EXISTS "Senders can view their own messages" ON public.editor_messages;

-- Create new policies
-- Everyone with a role can send messages
CREATE POLICY "Authenticated users can create messages"
ON public.editor_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Users can view messages they sent
CREATE POLICY "Senders can view their own messages"
ON public.editor_messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id);

-- Users can view messages sent to them
CREATE POLICY "Recipients can view their messages"
ON public.editor_messages
FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id);

-- Recipients can update (mark as read) their messages
CREATE POLICY "Recipients can update their messages"
ON public.editor_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id);

-- Admins can view and manage all messages
CREATE POLICY "Admins can manage all messages"
ON public.editor_messages
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));