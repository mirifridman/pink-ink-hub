-- Change password for user: arien@migdal-ohr.org.il
-- Run this in Supabase Dashboard -> SQL Editor

-- First, find the user ID by email
DO $$
DECLARE
  user_id_to_update UUID;
BEGIN
  -- Find user by email
  SELECT id INTO user_id_to_update
  FROM auth.users
  WHERE email = 'arien@migdal-ohr.org.il';
  
  IF user_id_to_update IS NULL THEN
    RAISE EXCEPTION 'User not found with email: arien@migdal-ohr.org.il';
  END IF;
  
  -- Update password using crypt function
  UPDATE auth.users
  SET 
    encrypted_password = crypt('Migdalor@arie', gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id_to_update;
  
  RAISE NOTICE 'Password updated successfully for user: %', user_id_to_update;
END $$;

-- Alternative: If the above doesn't work, use Supabase Admin API
-- Or use the Supabase Dashboard: Authentication -> Users -> Find user -> Reset Password
