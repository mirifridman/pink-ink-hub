-- Create user: אריה נאה
-- Email: arien@migdal-ohr.org.il
-- Password: Migdalor@arie
-- Role: admin
-- Run this in Supabase Dashboard -> SQL Editor

-- Note: This requires using Supabase Admin API
-- The easiest way is through Supabase Dashboard:
-- 1. Go to Authentication -> Users
-- 2. Click "Add User" -> "Create new user"
-- 3. Enter email: arien@migdal-ohr.org.il
-- 4. Enter password: Migdalor@arie
-- 5. Auto-confirm email: Yes
-- 6. Then run the SQL below to set role to admin

-- After creating the user through Dashboard, set role to admin:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'arien@migdal-ohr.org.il';

-- Also update full_name if needed:
UPDATE public.profiles
SET full_name = 'אריה נאה'
WHERE email = 'arien@migdal-ohr.org.il';
