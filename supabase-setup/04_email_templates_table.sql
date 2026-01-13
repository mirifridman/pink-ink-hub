-- ============================================
-- EMAIL TEMPLATES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create email_templates table for customizable email content
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  available_variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can manage templates
CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view templates" ON public.email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Updated at trigger
CREATE TRIGGER update_email_templates_updated_at 
  BEFORE UPDATE ON public.email_templates 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (template_key, name, description, subject, body_template, available_variables) VALUES
(
  'new_issue',
  'גיליון חדש',
  'נשלח לספקים כשיוצרים גיליון חדש',
  '🎉 גיליון חדש: {{magazine_name}} #{{issue_number}}',
  'שלום {{supplier_name}},

אנו שמחים לבשר על פתיחת גיליון חדש!

📰 מגזין: {{magazine_name}}
#️⃣ מספר גיליון: {{issue_number}}
🎯 נושא: {{issue_theme}}
📅 דדליין להגשה: {{deadline}}

בימים הקרובים תקבל פרטים נוספים על המשימות שלך.

בברכה,
צוות {{magazine_name}}',
  ARRAY['supplier_name', 'magazine_name', 'issue_number', 'issue_theme', 'deadline']
),
(
  'assignment',
  'הקצאת משימה',
  'נשלח לספק כשמקצים לו משימה',
  '📋 משימה חדשה: {{content_title}}',
  'שלום {{supplier_name}},

הוקצאה לך משימה חדשה:

📰 מגזין: {{magazine_name}}
📄 תוכן: {{content_title}}
📖 עמודים: {{pages}}
⏰ דדליין: {{deadline}}

אנא העלה את התוכן למערכת עד לתאריך הדדליין.

בברכה,
{{editor_name}}',
  ARRAY['supplier_name', 'magazine_name', 'content_title', 'pages', 'deadline', 'editor_name']
),
(
  'deadline_reminder',
  'תזכורת דדליין',
  'נשלח כתזכורת לפני דדליין',
  '⏰ תזכורת: {{issue_name}} - {{days_left}} ימים לדדליין',
  'שלום {{supplier_name}},

זוהי תזכורת שיש לך תכנים לגיליון {{issue_name}} שממתינים להעלאה.

⏰ דדליין: {{deadline}}
⏳ נותרו: {{days_left}} ימים

תכנים שצריך להעלות:
{{content_list}}

בברכה,
צוות המגזין',
  ARRAY['supplier_name', 'issue_name', 'deadline', 'days_left', 'content_list']
),
(
  'content_received',
  'תוכן התקבל',
  'נשלח לספק כאישור שתוכן התקבל',
  '✅ התוכן שלך התקבל: {{content_title}}',
  'שלום {{supplier_name}},

התוכן שלך התקבל בהצלחה!

📄 כותרת: {{content_title}}
📰 גיליון: {{issue_name}}
📖 עמודים: {{pages}}

תודה על העבודה המצוינת! הצוות שלנו יבדוק את התוכן בקרוב.

בברכה,
צוות המגזין',
  ARRAY['supplier_name', 'content_title', 'issue_name', 'pages']
)
ON CONFLICT (template_key) DO NOTHING;
