UPDATE system_settings 
SET value = '"migdal-ohr@arli.co.il"', updated_at = now() 
WHERE key = 'resend_from_email';