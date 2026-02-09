-- Create a security definer function to check admin role without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = 'admin'
  )
$$;

-- Create a function to check if user is editor or admin
CREATE OR REPLACE FUNCTION public.is_editor_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role IN ('admin', 'editor')
  )
$$;

-- Drop the problematic policy on profiles
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- Recreate the policy using the security definer function
CREATE POLICY "profiles_admin_all" ON public.profiles
FOR ALL
USING (public.is_admin(auth.uid()));

-- Also fix other tables that might have similar issues
-- employees table
DROP POLICY IF EXISTS "employees_delete_admin" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_editors" ON public.employees;
DROP POLICY IF EXISTS "employees_update_editors" ON public.employees;

CREATE POLICY "employees_delete_admin" ON public.employees
FOR DELETE
USING (public.is_admin(auth.uid()));

CREATE POLICY "employees_insert_editors" ON public.employees
FOR INSERT
WITH CHECK (public.is_editor_or_admin(auth.uid()));

CREATE POLICY "employees_update_editors" ON public.employees
FOR UPDATE
USING (public.is_editor_or_admin(auth.uid()));