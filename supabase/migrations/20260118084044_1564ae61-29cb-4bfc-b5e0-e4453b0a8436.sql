INSERT INTO system_settings (key, value, description) 
VALUES 
  ('resend_from_email', '"noreply@migdal-ohr.arli.co.il"', 'כתובת דואר שולח'),
  ('resend_from_name', '"מטה מנכ״ל"', 'שם השולח')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();