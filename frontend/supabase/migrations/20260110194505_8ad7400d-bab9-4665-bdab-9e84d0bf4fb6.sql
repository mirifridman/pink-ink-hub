-- Instead of disabling triggers, we'll update the check_page_overlap function to skip validation 
-- when called from the swap function, using a session variable

-- First, update the check_page_overlap function to check for a session variable
CREATE OR REPLACE FUNCTION public.check_page_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  issue_template_pages INTEGER;
  overlap_count INTEGER;
  skip_check TEXT;
BEGIN
  -- Check if we should skip validation (set by swap function)
  skip_check := current_setting('app.skip_page_overlap_check', true);
  IF skip_check = 'true' THEN
    RETURN NEW;
  END IF;

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

-- Now update the swap function to set the session variable
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
  -- Set session variable to skip overlap check
  PERFORM set_config('app.skip_page_overlap_check', 'true', true);
  
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
  
  -- Reset session variable
  PERFORM set_config('app.skip_page_overlap_check', 'false', true);
END;
$$;