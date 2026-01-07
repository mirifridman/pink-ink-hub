-- Create reminders table for tracking supplier reminders
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_item_id UUID REFERENCES public.lineup_items(id) ON DELETE CASCADE,
  insert_id UUID REFERENCES public.inserts(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'reminder_2days', 'reminder_urgent', 'custom')),
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create system_notifications table for editor notifications
CREATE TABLE public.system_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deadline_2days', 'deadline_today', 'overdue', 'assignment_sent', 'reminder_sent', 'custom')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  lineup_item_id UUID REFERENCES public.lineup_items(id) ON DELETE CASCADE,
  insert_id UUID REFERENCES public.inserts(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reminder_settings table for user preferences
CREATE TABLE public.reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  supplier_reminder_2days BOOLEAN NOT NULL DEFAULT true,
  supplier_reminder_urgent BOOLEAN NOT NULL DEFAULT true,
  editor_reminder_2days BOOLEAN NOT NULL DEFAULT true,
  editor_reminder_overdue BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for reminders
CREATE POLICY "Admins can manage reminders" ON public.reminders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Editors can manage reminders" ON public.reminders FOR ALL USING (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Authenticated users can view reminders" ON public.reminders FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS policies for system_notifications
CREATE POLICY "Users can view their own notifications" ON public.system_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.system_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.system_notifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Editors can create notifications" ON public.system_notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for reminder_settings
CREATE POLICY "Users can view their own settings" ON public.reminder_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own settings" ON public.reminder_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all settings" ON public.reminder_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_reminder_settings_updated_at
  BEFORE UPDATE ON public.reminder_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();