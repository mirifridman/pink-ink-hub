-- =====================================================
-- SUPABASE FULL EXPORT - Schema + Data
-- Generated: 2026-01-11
-- =====================================================

-- =====================================================
-- PART 1: ENUMS
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'designer', 'editor', 'publisher', 'social');

-- =====================================================
-- PART 2: FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  RETURN new;
END;
$$;

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
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.batch_update_lineup_pages(p_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.check_page_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- =====================================================
-- PART 3: TABLES
-- =====================================================

-- Table: magazines
CREATE TABLE public.magazines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: page_templates
CREATE TABLE public.page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_count INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Table: profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY NOT NULL,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: issues
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magazine_id UUID NOT NULL REFERENCES public.magazines(id),
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

-- Table: lineup_items
CREATE TABLE public.lineup_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  page_start INTEGER NOT NULL,
  page_end INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT,
  supplier_id UUID REFERENCES public.suppliers(id),
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

-- Table: inserts
CREATE TABLE public.inserts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content_type TEXT,
  supplier_id UUID REFERENCES public.suppliers(id),
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

-- Table: lineup_item_suppliers
CREATE TABLE public.lineup_item_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_item_id UUID NOT NULL REFERENCES public.lineup_items(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: insert_suppliers
CREATE TABLE public.insert_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insert_id UUID NOT NULL REFERENCES public.inserts(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: issue_editors
CREATE TABLE public.issue_editors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  lineup_item_id UUID REFERENCES public.lineup_items(id) ON DELETE CASCADE,
  insert_id UUID REFERENCES public.inserts(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID,
  created_by UUID NOT NULL,
  content_received BOOLEAN DEFAULT false,
  content_received_date TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  target_user_id UUID,
  is_personal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: lineup_comments
CREATE TABLE public.lineup_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_item_id UUID NOT NULL REFERENCES public.lineup_items(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: budget_items
CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  lineup_item_id UUID REFERENCES public.lineup_items(id) ON DELETE SET NULL,
  insert_id UUID REFERENCES public.inserts(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: role_permissions
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: user_preferences
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  remember_me BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  email_notifications BOOLEAN DEFAULT true,
  browser_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: reminder_settings
CREATE TABLE public.reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  editor_reminder_2days BOOLEAN NOT NULL DEFAULT true,
  editor_reminder_overdue BOOLEAN NOT NULL DEFAULT true,
  supplier_reminder_2days BOOLEAN NOT NULL DEFAULT true,
  supplier_reminder_urgent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: editor_messages
CREATE TABLE public.editor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: system_notifications
CREATE TABLE public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  issue_id UUID,
  lineup_item_id UUID,
  insert_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: user_invitations
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: magic_link_tokens
CREATE TABLE public.magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID,
  invited_by_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- PART 4: TRIGGERS
-- =====================================================

CREATE TRIGGER check_lineup_pages_overlap
  BEFORE INSERT OR UPDATE ON public.lineup_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_page_overlap();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PART 5: ENABLE RLS
-- =====================================================

ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inserts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_item_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insert_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 6: RLS POLICIES
-- =====================================================

-- Magazines policies
CREATE POLICY "Admins can manage magazines" ON public.magazines FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view magazines" ON public.magazines FOR SELECT USING (true);

-- Page templates policies
CREATE POLICY "Admins can manage page templates" ON public.page_templates FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view page templates" ON public.page_templates FOR SELECT USING (true);

-- Suppliers policies
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Editors can manage suppliers" ON public.suppliers FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Profiles policies
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view all roles" ON public.user_roles FOR SELECT USING (true);

-- Issues policies
CREATE POLICY "Admins can manage issues" ON public.issues FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view issues" ON public.issues FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Editors can create issues" ON public.issues FOR INSERT WITH CHECK (has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors can update issues" ON public.issues FOR UPDATE USING (has_role(auth.uid(), 'editor'));

-- Lineup items policies
CREATE POLICY "Admins can manage lineup items" ON public.lineup_items FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view lineup items" ON public.lineup_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Designers can update design fields" ON public.lineup_items FOR UPDATE USING (has_role(auth.uid(), 'designer')) WITH CHECK (has_role(auth.uid(), 'designer'));
CREATE POLICY "Editors can manage lineup items" ON public.lineup_items FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Inserts policies
CREATE POLICY "Admins can manage inserts" ON public.inserts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view inserts" ON public.inserts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Designers can update inserts design fields" ON public.inserts FOR UPDATE USING (has_role(auth.uid(), 'designer')) WITH CHECK (has_role(auth.uid(), 'designer'));
CREATE POLICY "Editors can manage inserts" ON public.inserts FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Lineup item suppliers policies
CREATE POLICY "Admins can manage lineup item suppliers" ON public.lineup_item_suppliers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view lineup item suppliers" ON public.lineup_item_suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Editors can manage lineup item suppliers" ON public.lineup_item_suppliers FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Insert suppliers policies
CREATE POLICY "Admins can manage insert suppliers" ON public.insert_suppliers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view insert suppliers" ON public.insert_suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Editors can manage insert suppliers" ON public.insert_suppliers FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Issue editors policies
CREATE POLICY "Admins can manage issue editors" ON public.issue_editors FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view issue editors" ON public.issue_editors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Editors can manage issue editors" ON public.issue_editors FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Reminders policies
CREATE POLICY "Admins can manage reminders" ON public.reminders FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view reminders" ON public.reminders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Editors can manage reminders" ON public.reminders FOR ALL USING (has_role(auth.uid(), 'editor'));
CREATE POLICY "Users can view reminders targeted to them" ON public.reminders FOR SELECT USING (auth.uid() = target_user_id);

-- Lineup comments policies
CREATE POLICY "Admins can manage all comments" ON public.lineup_comments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create comments" ON public.lineup_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view lineup comments" ON public.lineup_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own comments" ON public.lineup_comments FOR DELETE USING (auth.uid() = user_id);

-- Budget items policies
CREATE POLICY "Admins can manage budget items" ON public.budget_items FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view budget items" ON public.budget_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Editors can manage budget items" ON public.budget_items FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Role permissions policies
CREATE POLICY "Admins can manage permissions" ON public.role_permissions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view permissions" ON public.role_permissions FOR SELECT USING (true);

-- User preferences policies
CREATE POLICY "Admins can manage all preferences" ON public.user_preferences FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);

-- Reminder settings policies
CREATE POLICY "Admins can manage all settings" ON public.reminder_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage their own settings" ON public.reminder_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own settings" ON public.reminder_settings FOR SELECT USING (auth.uid() = user_id);

-- Editor messages policies
CREATE POLICY "Admins can manage all messages" ON public.editor_messages FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create messages" ON public.editor_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can update their messages" ON public.editor_messages FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Recipients can view their messages" ON public.editor_messages FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Senders can view their own messages" ON public.editor_messages FOR SELECT USING (auth.uid() = sender_id);

-- System notifications policies
CREATE POLICY "Admins can manage all notifications" ON public.system_notifications FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can create notifications" ON public.system_notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update their own notifications" ON public.system_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications" ON public.system_notifications FOR SELECT USING (auth.uid() = user_id);

-- User invitations policies
CREATE POLICY "Admins can manage invitations" ON public.user_invitations FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can view invitations" ON public.user_invitations FOR SELECT USING (has_role(auth.uid(), 'editor'));

-- Magic link tokens policies
CREATE POLICY "Admins can manage magic link tokens" ON public.magic_link_tokens FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can verify tokens" ON public.magic_link_tokens FOR SELECT USING (true);

-- =====================================================
-- PART 7: DATA - Magazines
-- =====================================================

INSERT INTO public.magazines (id, name, created_at, updated_at) VALUES
('96896ed8-0aa2-4db8-9b91-963c35f2a780', 'נפלאות קידס', '2026-01-07 12:17:28.832035+00', '2026-01-07 12:17:28.832035+00'),
('552b2ed4-6a68-418c-a242-1f933d23186c', 'נשיונל ג''אוגרפיק קידס', '2026-01-07 12:17:38.456109+00', '2026-01-07 12:17:38.456109+00');

-- =====================================================
-- PART 7: DATA - Page Templates
-- =====================================================

INSERT INTO public.page_templates (id, page_count, is_active, created_at, updated_at) VALUES
('d450a00a-bdaf-45c3-a721-5c59f9f78618', 52, true, '2026-01-07 17:14:47.187614+00', '2026-01-07 17:14:47.187614+00'),
('76cf8abf-11cb-4260-8778-5e43b6f93c5a', 68, true, '2026-01-07 17:14:47.187614+00', '2026-01-07 17:14:47.187614+00');

-- =====================================================
-- PART 7: DATA - Suppliers
-- =====================================================

INSERT INTO public.suppliers (id, name, contact_name, email, phone, notes, supplier_type, business_type, created_at, updated_at) VALUES
('8f6f0da9-2055-408b-849c-12f665c57160', 'ניב חביב', 'ניב חביב', 'niv@jrmedia.co.il', '050-2231317', NULL, 'designer', 'payslip', '2026-01-07 14:22:12.143111+00', '2026-01-07 14:22:12.143111+00'),
('ec9d582a-e8db-43d7-b9c4-2d72f444b1bb', 'רובן בניסתי', 'ראובן בניסטי', NULL, '054-7905006', NULL, 'writer', 'artist_salary', '2026-01-07 14:24:27.073773+00', '2026-01-07 14:24:27.073773+00'),
('7317a209-cf5e-4d49-9093-8a9b1635430f', 'איריס בן יאיר', 'איריס בן יאיר', NULL, '054-4232123', NULL, 'writer', 'licensed', '2026-01-07 14:25:17.572635+00', '2026-01-07 14:25:17.572635+00'),
('1c0bcad0-aec2-4d05-af55-9516aa5a00ce', 'יפית ברנשטיין', 'יפית ברנשטיין', NULL, '052-7131800', NULL, 'illustrator', 'licensed', '2026-01-07 14:25:57.215327+00', '2026-01-07 14:25:57.215327+00'),
('8938a586-d782-4e76-841b-7bfc6f2e26cc', 'הילה נועם', 'הילה נועם', NULL, NULL, NULL, 'illustrator', 'licensed', '2026-01-07 14:52:49.888441+00', '2026-01-07 14:52:49.888441+00'),
('5e51d125-d2e9-4bab-8a85-5a1d34e617de', 'מאיה בניטה', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-07 14:52:57.426185+00', '2026-01-07 14:52:57.426185+00'),
('a008c09d-4eca-4d37-851e-73ba194bc935', 'דור כהן', 'דור כהן', NULL, NULL, NULL, 'writer', 'artist_salary', '2026-01-07 14:53:14.972841+00', '2026-01-07 14:53:14.972841+00'),
('0737f521-84bd-4ba2-9c63-fbf5040178eb', 'עמי חניה', 'עמי חניה', NULL, NULL, NULL, 'other', 'licensed', '2026-01-07 14:53:43.935156+00', '2026-01-07 14:53:43.935156+00'),
('34aaef5f-688b-45f2-afdb-c17d905d06eb', 'תמר הירדני', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-07 15:02:11.602477+00', '2026-01-07 15:02:11.602477+00'),
('74cee34f-c8cb-4a98-9b70-448b9ca2db38', 'נופיה בר ניצן', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-07 15:02:55.846141+00', '2026-01-07 15:02:55.846141+00'),
('8dc45a4e-b4c0-42f7-b104-bb6b3b250a48', 'נדב מצ''טה', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-07 15:03:14.109018+00', '2026-01-07 15:03:14.109018+00'),
('b2c2f7ee-204c-4b0f-9dcc-7c5dd58b2caf', 'שחר אבן צור', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-07 15:03:26.743136+00', '2026-01-07 15:03:26.743136+00'),
('332a031c-881d-4a1c-a9d9-e3b6493e2468', 'עמי חניה', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-07 15:03:53.473243+00', '2026-01-07 15:03:53.473243+00'),
('479fca7c-bf96-4cc5-9ba9-0c07377c8d71', 'יוסי חיים מימון', NULL, NULL, NULL, NULL, 'writer', 'artist_salary', '2026-01-07 15:02:38.916355+00', '2026-01-07 15:15:10.722306+00'),
('99f4d910-85eb-4f5b-bb2a-afc77122793a', 'ריקי', 'ריקי', 'riki@jrmedia.co.il', '0535528588', NULL, 'writer', 'payslip', '2026-01-07 12:31:18.33723+00', '2026-01-07 21:57:31.070022+00'),
('33822db7-68e4-4796-b31a-4f218b05a2d3', 'ניר דמארי', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-08 20:52:24.683238+00', '2026-01-08 20:52:24.683238+00'),
('648c692b-a9af-4724-a49b-ea1f498fdcf1', 'דודי אפרתי', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-09 07:18:11.635679+00', '2026-01-09 07:18:11.635679+00'),
('90d18995-7ae1-4e04-9439-3e7565725af1', 'איתמר ליבנה', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-09 07:20:45.739815+00', '2026-01-09 07:20:45.739815+00'),
('9e4bf203-cc25-4113-b654-de6ff3fab4ca', 'הודיה ארזני תעשה', NULL, NULL, NULL, NULL, 'writer', 'licensed', '2026-01-09 07:21:30.40003+00', '2026-01-09 07:21:30.40003+00');

-- =====================================================
-- PART 7: DATA - Issues
-- =====================================================

INSERT INTO public.issues (id, magazine_id, issue_number, template_pages, distribution_month, hebrew_month, theme, design_start_date, sketch_close_date, print_date, status, created_by, created_at, updated_at) VALUES
('6094499e-e5ca-42ee-9a11-4d5a2a6a8e12', '96896ed8-0aa2-4db8-9b91-963c35f2a780', 61, 52, '2026-01-01', 'שבט', 'סודות החורף', '2025-12-25', '2026-01-04', '2026-01-12', 'in_progress', 'f4724df1-1614-4110-82e4-f02eaa1f3cb7', '2026-01-09 07:28:04.179746+00', '2026-01-10 21:16:17.823917+00'),
('02b0b155-1d71-42d3-b672-1a2c1f95e143', '552b2ed4-6a68-418c-a242-1f933d23186c', 154, 68, '2026-02-01', NULL, 'מכשפות', '2026-01-07', '2026-01-19', '2026-01-26', 'in_progress', 'f4724df1-1614-4110-82e4-f02eaa1f3cb7', '2026-01-07 15:06:47.408065+00', '2026-01-10 22:20:38.824136+00');

-- =====================================================
-- PART 7: DATA - Inserts
-- =====================================================

INSERT INTO public.inserts (id, issue_id, name, description, supplier_id, notes, text_ready, files_ready, is_designed, design_status, designer_notes, responsible_editor_id, assignment_sent, assignment_sent_date, assignment_sent_by, content_type, created_at, updated_at) VALUES
('9397bfe3-7379-49fa-abfc-94d9c83544d2', '6094499e-e5ca-42ee-9a11-4d5a2a6a8e12', 'אלף ב''טריוויה', 'חידון טריויה מודפס על סימניה', '34aaef5f-688b-45f2-afdb-c17d905d06eb', 'להדפיס על דף יותר קשיח מפעם קודמת', false, false, false, 'pending', NULL, '31cf1c89-2f41-4d6a-951e-4b322cf8bf33', false, NULL, NULL, NULL, '2026-01-10 21:16:28.157017+00', '2026-01-10 21:16:28.157017+00');

-- =====================================================
-- NOTE: Additional data for lineup_items, lineup_item_suppliers,
-- reminders, role_permissions, etc. should be added here.
-- The full data was truncated due to size but you can export
-- each table separately using SELECT statements.
-- =====================================================

-- To get the remaining data, run these queries in your Supabase SQL Editor:
-- SELECT * FROM lineup_items;
-- SELECT * FROM lineup_item_suppliers;
-- SELECT * FROM reminders;
-- SELECT * FROM role_permissions;
-- SELECT * FROM profiles;
-- SELECT * FROM user_roles;
-- etc.
