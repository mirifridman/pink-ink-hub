-- ============================================
-- FULL SUPABASE SCHEMA EXPORT
-- Generated: 2026-01-13
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'designer', 'publisher', 'social');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  RETURN new;
END;
$$;

-- Function to swap lineup pages
CREATE OR REPLACE FUNCTION public.swap_lineup_pages(
  p_item1_id uuid, 
  p_item2_id uuid, 
  p_item1_new_page_start integer, 
  p_item1_new_page_end integer, 
  p_item2_new_page_start integer, 
  p_item2_new_page_end integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM set_config('app.skip_page_overlap_check', 'true', true);
  
  UPDATE lineup_items 
  SET page_start = p_item1_new_page_start, 
      page_end = p_item1_new_page_end,
      design_status = 'standby'
  WHERE id = p_item1_id;
  
  UPDATE lineup_items 
  SET page_start = p_item2_new_page_start, 
      page_end = p_item2_new_page_end,
      design_status = 'standby'
  WHERE id = p_item2_id;
  
  PERFORM set_config('app.skip_page_overlap_check', 'false', true);
END;
$$;

-- Function to batch update lineup pages
CREATE OR REPLACE FUNCTION public.batch_update_lineup_pages(p_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  update_record JSONB;
  item_id UUID;
  new_page_start INTEGER;
  new_page_end INTEGER;
  set_standby BOOLEAN;
BEGIN
  PERFORM set_config('app.skip_page_overlap_check', 'true', true);
  
  FOR update_record IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    item_id := (update_record->>'id')::UUID;
    new_page_start := (update_record->>'page_start')::INTEGER;
    new_page_end := (update_record->>'page_end')::INTEGER;
    set_standby := COALESCE((update_record->>'set_standby')::BOOLEAN, false);
    
    IF set_standby THEN
      UPDATE lineup_items 
      SET page_start = new_page_start, 
          page_end = new_page_end,
          design_status = 'standby'
      WHERE id = item_id;
    ELSE
      UPDATE lineup_items 
      SET page_start = new_page_start, 
          page_end = new_page_end
      WHERE id = item_id;
    END IF;
  END LOOP;
  
  PERFORM set_config('app.skip_page_overlap_check', 'false', true);
END;
$$;

-- Function to check page overlap
CREATE OR REPLACE FUNCTION public.check_page_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  issue_template_pages INTEGER;
  overlap_count INTEGER;
  skip_check TEXT;
BEGIN
  skip_check := current_setting('app.skip_page_overlap_check', true);
  IF skip_check = 'true' THEN
    RETURN NEW;
  END IF;

  SELECT template_pages INTO issue_template_pages
  FROM public.issues
  WHERE id = NEW.issue_id;
  
  IF NEW.page_end > issue_template_pages THEN
    RAISE EXCEPTION 'Page range exceeds template pages (%)', issue_template_pages;
  END IF;
  
  SELECT COUNT(*) INTO overlap_count
  FROM public.lineup_items
  WHERE issue_id = NEW.issue_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (NEW.page_start BETWEEN page_start AND page_end)
      OR (NEW.page_end BETWEEN page_start AND page_end)
      OR (page_start BETWEEN NEW.page_start AND NEW.page_end)
    );
  
  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'Pages overlap with existing lineup items';
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- TABLES
-- ============================================

-- Magazines table
CREATE TABLE IF NOT EXISTS public.magazines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Page templates table
CREATE TABLE IF NOT EXISTS public.page_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_count INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  supplier_type TEXT DEFAULT 'writer',
  business_type TEXT DEFAULT 'licensed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Issues table
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  magazine_id UUID NOT NULL,
  issue_number INTEGER NOT NULL,
  template_pages INTEGER NOT NULL,
  distribution_month DATE NOT NULL,
  hebrew_month TEXT,
  theme TEXT NOT NULL,
  design_start_date DATE NOT NULL,
  sketch_close_date DATE NOT NULL,
  print_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Issue editors table
CREATE TABLE IF NOT EXISTS public.issue_editors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL,
  editor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lineup items table
CREATE TABLE IF NOT EXISTS public.lineup_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL,
  page_start INTEGER NOT NULL,
  page_end INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT,
  supplier_id UUID,
  source TEXT,
  notes TEXT,
  text_ready BOOLEAN NOT NULL DEFAULT false,
  files_ready BOOLEAN NOT NULL DEFAULT false,
  is_designed BOOLEAN NOT NULL DEFAULT false,
  design_status TEXT NOT NULL DEFAULT 'pending',
  designer_notes TEXT,
  responsible_editor_id UUID,
  assignment_sent BOOLEAN DEFAULT false,
  assignment_sent_date TIMESTAMP WITH TIME ZONE,
  assignment_sent_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lineup item suppliers (many-to-many)
CREATE TABLE IF NOT EXISTS public.lineup_item_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_item_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lineup comments table
CREATE TABLE IF NOT EXISTS public.lineup_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_item_id UUID NOT NULL,
  user_id UUID,
  user_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserts table
CREATE TABLE IF NOT EXISTS public.inserts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content_type TEXT,
  supplier_id UUID,
  notes TEXT,
  text_ready BOOLEAN NOT NULL DEFAULT false,
  files_ready BOOLEAN NOT NULL DEFAULT false,
  is_designed BOOLEAN NOT NULL DEFAULT false,
  design_status TEXT NOT NULL DEFAULT 'pending',
  designer_notes TEXT,
  responsible_editor_id UUID,
  assignment_sent BOOLEAN DEFAULT false,
  assignment_sent_date TIMESTAMP WITH TIME ZONE,
  assignment_sent_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert suppliers (many-to-many)
CREATE TABLE IF NOT EXISTS public.insert_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insert_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budget items table
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL,
  lineup_item_id UUID,
  insert_id UUID,
  supplier_id UUID,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  notes TEXT,
  is_system_expense BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL,
  lineup_item_id UUID,
  insert_id UUID,
  supplier_id UUID,
  target_user_id UUID,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID,
  reminder_count INTEGER DEFAULT 0,
  content_received BOOLEAN DEFAULT false,
  content_received_date TIMESTAMP WITH TIME ZONE,
  is_personal BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reminder settings table
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_reminder_2days BOOLEAN NOT NULL DEFAULT true,
  supplier_reminder_urgent BOOLEAN NOT NULL DEFAULT true,
  editor_reminder_2days BOOLEAN NOT NULL DEFAULT true,
  editor_reminder_overdue BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System notifications table
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  issue_id UUID,
  lineup_item_id UUID,
  insert_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Editor messages table
CREATE TABLE IF NOT EXISTS public.editor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  theme TEXT DEFAULT 'dark',
  remember_me BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  browser_notifications BOOLEAN DEFAULT false,
  push_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Magic link tokens table
CREATE TABLE IF NOT EXISTS public.magic_link_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  invited_by UUID,
  invited_by_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_type TEXT DEFAULT 'desktop',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated at triggers
CREATE TRIGGER update_magazines_updated_at BEFORE UPDATE ON public.magazines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_page_templates_updated_at BEFORE UPDATE ON public.page_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lineup_items_updated_at BEFORE UPDATE ON public.lineup_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lineup_comments_updated_at BEFORE UPDATE ON public.lineup_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inserts_updated_at BEFORE UPDATE ON public.inserts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reminder_settings_updated_at BEFORE UPDATE ON public.reminder_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Page overlap check trigger
CREATE TRIGGER check_lineup_page_overlap BEFORE INSERT OR UPDATE ON public.lineup_items FOR EACH ROW EXECUTE FUNCTION public.check_page_overlap();

-- Handle new user trigger (on auth.users)
-- Note: This trigger needs to be created on auth.users table
-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_item_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inserts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insert_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Magazines policies
CREATE POLICY "Everyone can view magazines" ON public.magazines FOR SELECT USING (true);
CREATE POLICY "Admins can manage magazines" ON public.magazines FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Page templates policies
CREATE POLICY "Everyone can view page templates" ON public.page_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage page templates" ON public.page_templates FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can manage suppliers" ON public.suppliers FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Profiles policies
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Authenticated users can view all roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Role permissions policies
CREATE POLICY "Everyone can view permissions" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage permissions" ON public.role_permissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Issues policies
CREATE POLICY "Authenticated users can view issues" ON public.issues FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage issues" ON public.issues FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can create issues" ON public.issues FOR INSERT WITH CHECK (has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors can update issues" ON public.issues FOR UPDATE USING (has_role(auth.uid(), 'editor'));

-- Issue editors policies
CREATE POLICY "Authenticated users can view issue editors" ON public.issue_editors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage issue editors" ON public.issue_editors FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can manage issue editors" ON public.issue_editors FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Lineup items policies
CREATE POLICY "Authenticated users can view lineup items" ON public.lineup_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage lineup items" ON public.lineup_items FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can manage lineup items" ON public.lineup_items FOR ALL USING (has_role(auth.uid(), 'editor'));
CREATE POLICY "Designers can update design fields" ON public.lineup_items FOR UPDATE USING (has_role(auth.uid(), 'designer')) WITH CHECK (has_role(auth.uid(), 'designer'));

-- Lineup item suppliers policies
CREATE POLICY "Authenticated users can view lineup item suppliers" ON public.lineup_item_suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage lineup item suppliers" ON public.lineup_item_suppliers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can manage lineup item suppliers" ON public.lineup_item_suppliers FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Lineup comments policies
CREATE POLICY "Authenticated users can view lineup comments" ON public.lineup_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create comments" ON public.lineup_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own comments" ON public.lineup_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all comments" ON public.lineup_comments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Inserts policies
CREATE POLICY "Authenticated users can view inserts" ON public.inserts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage inserts" ON public.inserts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can manage inserts" ON public.inserts FOR ALL USING (has_role(auth.uid(), 'editor'));
CREATE POLICY "Designers can update inserts design fields" ON public.inserts FOR UPDATE USING (has_role(auth.uid(), 'designer')) WITH CHECK (has_role(auth.uid(), 'designer'));

-- Insert suppliers policies
CREATE POLICY "Authenticated users can view insert suppliers" ON public.insert_suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage insert suppliers" ON public.insert_suppliers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can manage insert suppliers" ON public.insert_suppliers FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Budget items policies
CREATE POLICY "Authenticated users can view budget items" ON public.budget_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage budget items" ON public.budget_items FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can manage budget items" ON public.budget_items FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Reminders policies
CREATE POLICY "Authenticated users can view reminders" ON public.reminders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage reminders" ON public.reminders FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can manage reminders" ON public.reminders FOR ALL USING (has_role(auth.uid(), 'editor'));
CREATE POLICY "Users can view reminders targeted to them" ON public.reminders FOR SELECT USING (auth.uid() = target_user_id);

-- Reminder settings policies
CREATE POLICY "Users can view their own settings" ON public.reminder_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own settings" ON public.reminder_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all settings" ON public.reminder_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- System notifications policies
CREATE POLICY "Users can view their own notifications" ON public.system_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.system_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.system_notifications FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can create notifications" ON public.system_notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Editor messages policies
CREATE POLICY "Senders can view their own messages" ON public.editor_messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Recipients can view their messages" ON public.editor_messages FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Recipients can update their messages" ON public.editor_messages FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Authenticated users can create messages" ON public.editor_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can manage all messages" ON public.editor_messages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all preferences" ON public.user_preferences FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User invitations policies
CREATE POLICY "Admins can manage invitations" ON public.user_invitations FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can view invitations" ON public.user_invitations FOR SELECT USING (has_role(auth.uid(), 'editor'));

-- Magic link tokens policies
CREATE POLICY "Anyone can verify tokens" ON public.magic_link_tokens FOR SELECT USING (true);
CREATE POLICY "Admins can manage magic link tokens" ON public.magic_link_tokens FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Push subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON public.push_subscriptions FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- END OF EXPORT
-- ============================================
