-- Add is_system_expense column to budget_items to distinguish system expenses from lineup items
ALTER TABLE public.budget_items 
ADD COLUMN is_system_expense boolean NOT NULL DEFAULT false;