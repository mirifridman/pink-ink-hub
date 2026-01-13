-- Create magazines table
CREATE TABLE public.magazines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issues table
CREATE TABLE public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  magazine_id UUID NOT NULL REFERENCES public.magazines(id) ON DELETE RESTRICT,
  issue_number INTEGER NOT NULL,
  template_pages INTEGER NOT NULL CHECK (template_pages IN (52, 68)),
  distribution_month DATE NOT NULL,
  theme TEXT NOT NULL,
  design_start_date DATE NOT NULL,
  sketch_close_date DATE NOT NULL,
  print_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(magazine_id, issue_number),
  CHECK (sketch_close_date > design_start_date),
  CHECK (print_date > sketch_close_date)
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lineup_items table
CREATE TABLE public.lineup_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  page_start INTEGER NOT NULL CHECK (page_start > 0),
  page_end INTEGER NOT NULL CHECK (page_end > 0),
  content TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  source TEXT,
  notes TEXT,
  text_ready BOOLEAN NOT NULL DEFAULT false,
  files_ready BOOLEAN NOT NULL DEFAULT false,
  is_designed BOOLEAN NOT NULL DEFAULT false,
  designer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (page_end >= page_start)
);

-- Create inserts table
CREATE TABLE public.inserts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  supplier_id UUID REFERENCES public.suppliers(id),
  notes TEXT,
  text_ready BOOLEAN NOT NULL DEFAULT false,
  files_ready BOOLEAN NOT NULL DEFAULT false,
  is_designed BOOLEAN NOT NULL DEFAULT false,
  designer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inserts ENABLE ROW LEVEL SECURITY;

-- Magazines policies (public read, admin/editor write)
CREATE POLICY "Everyone can view magazines" ON public.magazines
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage magazines" ON public.magazines
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Issues policies
CREATE POLICY "Authenticated users can view issues" ON public.issues
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage issues" ON public.issues
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can create issues" ON public.issues
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can update issues" ON public.issues
  FOR UPDATE USING (has_role(auth.uid(), 'editor'));

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage suppliers" ON public.suppliers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can manage suppliers" ON public.suppliers
  FOR ALL USING (has_role(auth.uid(), 'editor'));

-- Lineup items policies
CREATE POLICY "Authenticated users can view lineup items" ON public.lineup_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage lineup items" ON public.lineup_items
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can manage lineup items" ON public.lineup_items
  FOR ALL USING (has_role(auth.uid(), 'editor'));

CREATE POLICY "Designers can update design fields" ON public.lineup_items
  FOR UPDATE USING (has_role(auth.uid(), 'designer'))
  WITH CHECK (has_role(auth.uid(), 'designer'));

-- Inserts policies
CREATE POLICY "Authenticated users can view inserts" ON public.inserts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage inserts" ON public.inserts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can manage inserts" ON public.inserts
  FOR ALL USING (has_role(auth.uid(), 'editor'));

CREATE POLICY "Designers can update inserts design fields" ON public.inserts
  FOR UPDATE USING (has_role(auth.uid(), 'designer'))
  WITH CHECK (has_role(auth.uid(), 'designer'));

-- Create function to check page overlap
CREATE OR REPLACE FUNCTION public.check_page_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  issue_template_pages INTEGER;
  overlap_count INTEGER;
BEGIN
  -- Get template pages for the issue
  SELECT template_pages INTO issue_template_pages
  FROM public.issues
  WHERE id = NEW.issue_id;
  
  -- Check if pages exceed template
  IF NEW.page_end > issue_template_pages THEN
    RAISE EXCEPTION 'Page range exceeds template pages (%)', issue_template_pages;
  END IF;
  
  -- Check for overlap with other items (excluding current item on update)
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

-- Create trigger for page overlap
CREATE TRIGGER check_lineup_page_overlap
  BEFORE INSERT OR UPDATE ON public.lineup_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_page_overlap();

-- Create updated_at triggers
CREATE TRIGGER update_magazines_updated_at
  BEFORE UPDATE ON public.magazines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lineup_items_updated_at
  BEFORE UPDATE ON public.lineup_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inserts_updated_at
  BEFORE UPDATE ON public.inserts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default magazines
INSERT INTO public.magazines (name) VALUES ('מגזין לילדים'), ('מגזין טבע');