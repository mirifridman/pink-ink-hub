-- Add contact fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT;