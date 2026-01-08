-- Add content_type column to lineup_items table for visual classification
ALTER TABLE public.lineup_items 
ADD COLUMN content_type TEXT;

-- Add content_type column to inserts table as well for consistency
ALTER TABLE public.inserts 
ADD COLUMN content_type TEXT;