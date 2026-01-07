-- Drop the existing check constraint and add a new one with 'payslip' option
ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_business_type_check;

ALTER TABLE public.suppliers 
ADD CONSTRAINT suppliers_business_type_check 
CHECK (business_type IN ('licensed', 'exempt', 'company', 'artist_salary', 'payslip'));