-- Create role_permissions table for dynamic permission management
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_key text NOT NULL,
  is_allowed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role, permission_key)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can view permissions (needed for access control)
CREATE POLICY "Everyone can view permissions"
ON public.role_permissions FOR SELECT
USING (true);

-- Only admins can manage permissions
CREATE POLICY "Admins can manage permissions"
ON public.role_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for all roles
INSERT INTO public.role_permissions (role, permission_key, is_allowed) VALUES
-- Admin permissions (full access)
('admin', 'view_dashboard', true),
('admin', 'view_issues', true),
('admin', 'manage_issues', true),
('admin', 'view_lineup', true),
('admin', 'manage_lineup', true),
('admin', 'view_suppliers', true),
('admin', 'manage_suppliers', true),
('admin', 'view_team', true),
('admin', 'manage_team', true),
('admin', 'view_reminders', true),
('admin', 'manage_reminders', true),
('admin', 'view_schedule', true),
('admin', 'view_messages', true),
('admin', 'send_messages', true),
('admin', 'view_settings', true),
('admin', 'manage_settings', true),
('admin', 'view_users', true),
('admin', 'manage_users', true),

-- Editor permissions
('editor', 'view_dashboard', true),
('editor', 'view_issues', true),
('editor', 'manage_issues', true),
('editor', 'view_lineup', true),
('editor', 'manage_lineup', true),
('editor', 'view_suppliers', true),
('editor', 'manage_suppliers', true),
('editor', 'view_team', true),
('editor', 'manage_team', false),
('editor', 'view_reminders', true),
('editor', 'manage_reminders', true),
('editor', 'view_schedule', true),
('editor', 'view_messages', true),
('editor', 'send_messages', true),
('editor', 'view_settings', false),
('editor', 'manage_settings', false),
('editor', 'view_users', false),
('editor', 'manage_users', false),

-- Designer permissions
('designer', 'view_dashboard', true),
('designer', 'view_issues', true),
('designer', 'manage_issues', false),
('designer', 'view_lineup', true),
('designer', 'manage_lineup', false),
('designer', 'view_suppliers', true),
('designer', 'manage_suppliers', false),
('designer', 'view_team', true),
('designer', 'manage_team', false),
('designer', 'view_reminders', false),
('designer', 'manage_reminders', false),
('designer', 'view_schedule', true),
('designer', 'view_messages', true),
('designer', 'send_messages', true),
('designer', 'view_settings', false),
('designer', 'manage_settings', false),
('designer', 'view_users', false),
('designer', 'manage_users', false),

-- Publisher permissions
('publisher', 'view_dashboard', false),
('publisher', 'view_issues', true),
('publisher', 'manage_issues', false),
('publisher', 'view_lineup', true),
('publisher', 'manage_lineup', false),
('publisher', 'view_suppliers', false),
('publisher', 'manage_suppliers', false),
('publisher', 'view_team', true),
('publisher', 'manage_team', false),
('publisher', 'view_reminders', false),
('publisher', 'manage_reminders', false),
('publisher', 'view_schedule', true),
('publisher', 'view_messages', true),
('publisher', 'send_messages', true),
('publisher', 'view_settings', false),
('publisher', 'manage_settings', false),
('publisher', 'view_users', false),
('publisher', 'manage_users', false);