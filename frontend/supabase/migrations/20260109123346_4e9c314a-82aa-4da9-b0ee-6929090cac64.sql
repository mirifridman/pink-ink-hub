-- Drop the old restrictive SELECT policy for suppliers
DROP POLICY IF EXISTS "Admins and editors can view suppliers" ON public.suppliers;

-- Create a new policy that allows all authenticated users to view suppliers
-- The frontend permission system will control UI visibility
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers
FOR SELECT
USING (auth.uid() IS NOT NULL);