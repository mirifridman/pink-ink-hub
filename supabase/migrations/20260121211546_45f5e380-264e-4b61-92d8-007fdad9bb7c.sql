-- Add is_read field to emails table
ALTER TABLE public.emails ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;