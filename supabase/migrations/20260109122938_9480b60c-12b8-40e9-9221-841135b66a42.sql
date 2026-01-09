-- Add new permission rows for all roles for the new supplier permissions
INSERT INTO public.role_permissions (role, permission_key, is_allowed, created_at, updated_at)
SELECT role, 'view_suppliers_budget', 
  CASE WHEN role = 'admin' THEN true ELSE false END, 
  now(), now()
FROM (SELECT DISTINCT role FROM public.role_permissions) AS roles
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key, is_allowed, created_at, updated_at)
SELECT role, 'view_suppliers_assignments', 
  CASE WHEN role = 'admin' THEN true ELSE false END, 
  now(), now()
FROM (SELECT DISTINCT role FROM public.role_permissions) AS roles
ON CONFLICT DO NOTHING;