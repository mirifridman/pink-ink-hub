-- Drop the restrictive policies on user_roles for viewing
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Editors can view all roles" ON public.user_roles;

-- Create a new policy that allows all authenticated users to view all roles
CREATE POLICY "Authenticated users can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (true);