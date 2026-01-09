-- Create budget_items table for managing supplier payments separately from lineup
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  lineup_item_id UUID REFERENCES public.lineup_items(id) ON DELETE SET NULL,
  insert_id UUID REFERENCES public.inserts(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  page_count INTEGER DEFAULT 0,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage budget items" 
ON public.budget_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Editors can manage budget items" 
ON public.budget_items 
FOR ALL 
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Authenticated users can view budget items" 
ON public.budget_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();