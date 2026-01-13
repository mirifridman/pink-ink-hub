import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  subject: string;
  body_template: string;
  available_variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Default templates (used when DB templates don't exist)
export const defaultEmailTemplates: Record<string, Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>> = {
  new_issue: {
    template_key: 'new_issue',
    name: 'גיליון חדש',
    description: 'נשלח לספקים כשיוצרים גיליון חדש',
    subject: '🎉 גיליון חדש: {{magazine_name}} #{{issue_number}}',
    body_template: `שלום {{supplier_name}},

אנו שמחים לבשר על פתיחת גיליון חדש!

📰 מגזין: {{magazine_name}}
#️⃣ מספר גיליון: {{issue_number}}
🎯 נושא: {{issue_theme}}
📅 דדליין להגשה: {{deadline}}

בימים הקרובים תקבל פרטים נוספים על המשימות שלך.

בברכה,
צוות {{magazine_name}}`,
    available_variables: ['supplier_name', 'magazine_name', 'issue_number', 'issue_theme', 'deadline'],
    is_active: true,
  },
  assignment: {
    template_key: 'assignment',
    name: 'הקצאת משימה',
    description: 'נשלח לספק כשמקצים לו משימה',
    subject: '📋 משימה חדשה: {{content_title}}',
    body_template: `שלום {{supplier_name}},

הוקצאה לך משימה חדשה:

📰 מגזין: {{magazine_name}}
📄 תוכן: {{content_title}}
📖 עמודים: {{pages}}
⏰ דדליין: {{deadline}}

אנא העלה את התוכן למערכת עד לתאריך הדדליין.

בברכה,
{{editor_name}}`,
    available_variables: ['supplier_name', 'magazine_name', 'content_title', 'pages', 'deadline', 'editor_name'],
    is_active: true,
  },
  deadline_reminder: {
    template_key: 'deadline_reminder',
    name: 'תזכורת דדליין',
    description: 'נשלח כתזכורת לפני דדליין',
    subject: '⏰ תזכורת: {{issue_name}} - {{days_left}} ימים לדדליין',
    body_template: `שלום {{supplier_name}},

זוהי תזכורת שיש לך תכנים לגיליון {{issue_name}} שממתינים להעלאה.

⏰ דדליין: {{deadline}}
⏳ נותרו: {{days_left}} ימים

תכנים שצריך להעלות:
{{content_list}}

בברכה,
צוות המגזין`,
    available_variables: ['supplier_name', 'issue_name', 'deadline', 'days_left', 'content_list'],
    is_active: true,
  },
  content_received: {
    template_key: 'content_received',
    name: 'תוכן התקבל',
    description: 'נשלח לספק כאישור שתוכן התקבל',
    subject: '✅ התוכן שלך התקבל: {{content_title}}',
    body_template: `שלום {{supplier_name}},

התוכן שלך התקבל בהצלחה!

📄 כותרת: {{content_title}}
📰 גיליון: {{issue_name}}
📖 עמודים: {{pages}}

תודה על העבודה המצוינת! הצוות שלנו יבדוק את התוכן בקרוב.

בברכה,
צוות המגזין`,
    available_variables: ['supplier_name', 'content_title', 'issue_name', 'pages'],
    is_active: true,
  },
};

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');
      
      if (error) {
        // If table doesn't exist, return default templates
        console.log('Email templates table not found, using defaults');
        return Object.values(defaultEmailTemplates).map((t, idx) => ({
          ...t,
          id: `default-${idx}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as EmailTemplate[];
      }
      
      return data as EmailTemplate[];
    },
  });
}

export function useEmailTemplate(templateKey: string) {
  return useQuery({
    queryKey: ['emailTemplate', templateKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .single();
      
      if (error) {
        // Return default template if not found in DB
        const defaultTemplate = defaultEmailTemplates[templateKey];
        if (defaultTemplate) {
          return {
            ...defaultTemplate,
            id: `default-${templateKey}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as EmailTemplate;
        }
        return null;
      }
      
      return data as EmailTemplate;
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      // Skip if it's a default template (not in DB)
      if (id.startsWith('default-')) {
        // Try to insert as new
        const templateKey = id.replace('default-', '');
        const defaultTemplate = defaultEmailTemplates[templateKey];
        if (!defaultTemplate) throw new Error('Template not found');
        
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            ...defaultTemplate,
            ...updates,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
      
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast.success('התבנית עודכנה בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה בעדכון התבנית: ' + error.message);
    },
  });
}

// Helper function to replace variables in template
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}
