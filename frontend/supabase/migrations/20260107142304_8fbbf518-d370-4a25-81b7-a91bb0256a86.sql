-- Create junction table for lineup items and suppliers (many-to-many)
CREATE TABLE public.lineup_item_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_item_id UUID NOT NULL REFERENCES public.lineup_items(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lineup_item_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.lineup_item_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view lineup item suppliers"
ON public.lineup_item_suppliers
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can manage lineup item suppliers"
ON public.lineup_item_suppliers
FOR ALL
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can manage lineup item suppliers"
ON public.lineup_item_suppliers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create similar table for inserts
CREATE TABLE public.insert_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insert_id UUID NOT NULL REFERENCES public.inserts(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(insert_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.insert_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view insert suppliers"
ON public.insert_suppliers
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can manage insert suppliers"
ON public.insert_suppliers
FOR ALL
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can manage insert suppliers"
ON public.insert_suppliers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));