-- Add external_id column for n8n/external email IDs
ALTER TABLE public.incoming_emails
ADD COLUMN external_id text UNIQUE;