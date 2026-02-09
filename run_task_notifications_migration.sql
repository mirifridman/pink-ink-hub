-- Run this in Supabase Dashboard -> SQL Editor

-- Add deadline_reminder_sent field to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS deadline_reminder_sent BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.tasks.deadline_reminder_sent IS 'Whether deadline reminder notification has been sent';

-- Function to create notification when task assignees change
-- This trigger fires when a new row is inserted into task_assignees
CREATE OR REPLACE FUNCTION public.notify_task_assignees_changed()
RETURNS TRIGGER AS $$
DECLARE
  assignee_user_id UUID;
  task_title TEXT;
  task_description TEXT;
BEGIN
  -- Only handle INSERT (new assignee added)
  IF TG_OP = 'INSERT' THEN
    -- Get task title and description
    SELECT title, description INTO task_title, task_description
    FROM public.tasks 
    WHERE id = NEW.task_id;
    
    -- If task not found, skip
    IF task_title IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get user_id from employee
    SELECT user_id INTO assignee_user_id 
    FROM public.employees 
    WHERE id = NEW.employee_id;
    
    -- Only create notification if user_id exists
    IF assignee_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        link
      ) VALUES (
        assignee_user_id,
        'משימה חדשה: ' || task_title,
        COALESCE(task_description, 'משימה חדשה הוקצתה אליך'),
        'task_assigned',
        '/tasks'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task_assignees changes
DROP TRIGGER IF EXISTS task_assignees_changed ON public.task_assignees;
CREATE TRIGGER task_assignees_changed
  AFTER INSERT ON public.task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assignees_changed();

-- Function to create notification when task is completed
-- This trigger fires when a task status changes to 'completed'
CREATE OR REPLACE FUNCTION public.notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  assignee_record RECORD;
  assignee_user_id UUID;
  completer_user_id UUID;
  completer_name TEXT;
  task_title TEXT;
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get completer user_id
    completer_user_id := COALESCE(NEW.approved_by, NEW.created_by);
    
    -- Get completer name
    SELECT COALESCE(full_name, email) INTO completer_name
    FROM public.profiles
    WHERE id = completer_user_id;
    
    -- Get task title
    task_title := NEW.title;
    
    -- Notify all assignees except the completer
    FOR assignee_record IN 
      SELECT ta.employee_id, e.user_id
      FROM public.task_assignees ta
      JOIN public.employees e ON e.id = ta.employee_id
      WHERE ta.task_id = NEW.id
        AND e.user_id IS NOT NULL
        AND e.user_id != completer_user_id
    LOOP
      assignee_user_id := assignee_record.user_id;
      
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        link
      ) VALUES (
        assignee_user_id,
        'משימה הושלמה: ' || task_title,
        COALESCE(completer_name, 'משתמש') || ' השלים את המשימה: ' || task_title,
        'task_completed',
        '/tasks'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task completion (on UPDATE)
DROP TRIGGER IF EXISTS task_completed_on_update ON public.tasks;
CREATE TRIGGER task_completed_on_update
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
  EXECUTE FUNCTION public.notify_task_completed();
