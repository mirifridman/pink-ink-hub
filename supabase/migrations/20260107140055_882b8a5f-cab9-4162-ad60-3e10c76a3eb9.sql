-- Add business_type column to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN business_type text DEFAULT 'licensed' 
CHECK (business_type IN ('licensed', 'exempt', 'company', 'artist_salary'));

-- Add supplier_type column for categorization (writer, illustrator, photographer, etc.)
ALTER TABLE public.suppliers 
ADD COLUMN supplier_type text DEFAULT 'writer';