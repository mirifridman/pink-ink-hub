-- Create a function to swap pages between two lineup items
-- This function bypasses the check_page_overlap trigger by performing all operations atomically
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
  -- Temporarily disable the check_page_overlap trigger by updating both items in a way
  -- that the constraint check sees them as swapped atomically
  
  -- First, move item1 to very high temporary pages (out of normal range but allowed temporarily)
  UPDATE lineup_items 
  SET page_start = 99990, page_end = 99999
  WHERE id = p_item1_id;
  
  -- Now update item2 with item1's original pages
  UPDATE lineup_items 
  SET page_start = p_item2_new_page_start, 
      page_end = p_item2_new_page_end,
      design_status = 'standby'
  WHERE id = p_item2_id;
  
  -- Finally update item1 with item2's original pages
  UPDATE lineup_items 
  SET page_start = p_item1_new_page_start, 
      page_end = p_item1_new_page_end,
      design_status = 'standby'
  WHERE id = p_item1_id;
END;
$$;