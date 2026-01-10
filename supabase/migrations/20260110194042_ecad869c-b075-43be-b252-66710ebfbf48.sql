-- Drop and recreate the function to disable the trigger during swap
CREATE OR REPLACE FUNCTION public.swap_lineup_pages(
  p_item1_id UUID,
  p_item2_id UUID,
  p_item1_new_page_start INTEGER,
  p_item1_new_page_end INTEGER,
  p_item2_new_page_start INTEGER,
  p_item2_new_page_end INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Temporarily disable the trigger
  ALTER TABLE lineup_items DISABLE TRIGGER ALL;
  
  -- Update item1 with its new pages
  UPDATE lineup_items 
  SET page_start = p_item1_new_page_start, 
      page_end = p_item1_new_page_end,
      design_status = 'standby'
  WHERE id = p_item1_id;
  
  -- Update item2 with its new pages
  UPDATE lineup_items 
  SET page_start = p_item2_new_page_start, 
      page_end = p_item2_new_page_end,
      design_status = 'standby'
  WHERE id = p_item2_id;
  
  -- Re-enable the trigger
  ALTER TABLE lineup_items ENABLE TRIGGER ALL;
END;
$$;