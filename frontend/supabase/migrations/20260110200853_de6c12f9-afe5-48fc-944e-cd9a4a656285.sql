-- Create a function to update multiple lineup items at once, skipping overlap check
CREATE OR REPLACE FUNCTION public.batch_update_lineup_pages(
  p_updates JSONB
)
RETURNS VOID
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
  -- Set session variable to skip overlap check for all updates
  PERFORM set_config('app.skip_page_overlap_check', 'true', true);
  
  -- Loop through each update
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
  
  -- Reset session variable
  PERFORM set_config('app.skip_page_overlap_check', 'false', true);
END;
$$;