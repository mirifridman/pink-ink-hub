-- Insert new lineup status permissions for all roles
INSERT INTO public.role_permissions (role, permission_key, is_allowed)
VALUES
  -- Admin - all permissions
  ('admin', 'edit_lineup_text_ready', true),
  ('admin', 'edit_lineup_files_ready', true),
  ('admin', 'edit_lineup_is_designed', true),
  -- Editor - text and files
  ('editor', 'edit_lineup_text_ready', true),
  ('editor', 'edit_lineup_files_ready', true),
  ('editor', 'edit_lineup_is_designed', false),
  -- Designer - only is_designed
  ('designer', 'edit_lineup_text_ready', false),
  ('designer', 'edit_lineup_files_ready', false),
  ('designer', 'edit_lineup_is_designed', true),
  -- Publisher - no status editing
  ('publisher', 'edit_lineup_text_ready', false),
  ('publisher', 'edit_lineup_files_ready', false),
  ('publisher', 'edit_lineup_is_designed', false),
  -- Social - no status editing
  ('social', 'edit_lineup_text_ready', false),
  ('social', 'edit_lineup_files_ready', false),
  ('social', 'edit_lineup_is_designed', false)
ON CONFLICT DO NOTHING;

-- Add social role permissions for existing permission keys
INSERT INTO public.role_permissions (role, permission_key, is_allowed)
VALUES
  ('social', 'view_dashboard', false),
  ('social', 'view_issues', true),
  ('social', 'manage_issues', false),
  ('social', 'view_lineup', true),
  ('social', 'manage_lineup', false),
  ('social', 'view_suppliers', false),
  ('social', 'manage_suppliers', false),
  ('social', 'view_team', true),
  ('social', 'manage_team', false),
  ('social', 'view_reminders', false),
  ('social', 'manage_reminders', false),
  ('social', 'view_schedule', true),
  ('social', 'view_messages', true),
  ('social', 'send_messages', true),
  ('social', 'view_settings', false),
  ('social', 'manage_settings', false),
  ('social', 'view_users', false),
  ('social', 'manage_users', false)
ON CONFLICT DO NOTHING;