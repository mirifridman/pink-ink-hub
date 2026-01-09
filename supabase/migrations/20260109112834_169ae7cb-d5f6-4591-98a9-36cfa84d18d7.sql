-- Add design_status column to lineup_items to track designer approval state
-- Values: 'pending' (not designed), 'designed' (approved), 'standby' (was designed but needs re-approval after page move)
ALTER TABLE public.lineup_items 
ADD COLUMN IF NOT EXISTS design_status text NOT NULL DEFAULT 'pending';

-- Update existing records: if is_designed is true, set to 'designed', otherwise 'pending'
UPDATE public.lineup_items 
SET design_status = CASE WHEN is_designed = true THEN 'designed' ELSE 'pending' END;

-- Add same column to inserts table for consistency
ALTER TABLE public.inserts 
ADD COLUMN IF NOT EXISTS design_status text NOT NULL DEFAULT 'pending';

-- Update existing inserts records
UPDATE public.inserts 
SET design_status = CASE WHEN is_designed = true THEN 'designed' ELSE 'pending' END;