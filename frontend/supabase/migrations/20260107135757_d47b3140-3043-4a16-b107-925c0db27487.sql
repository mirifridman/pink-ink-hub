-- Allow admins to view all user roles (already exists but let's ensure it works)
-- Add policy for editors to view all profiles (needed for editor assignment)
CREATE POLICY "Editors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'editor'::app_role));

-- Allow editors to view all user roles (for seeing who has what role)
CREATE POLICY "Editors can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'editor'::app_role));