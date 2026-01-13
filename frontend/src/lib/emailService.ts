import { supabase } from '@/integrations/supabase/client';

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html }
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }

    return data as EmailResponse;
  } catch (err) {
    console.error('Email sending exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendBulkEmails(
  emails: Array<{ to: string; subject: string; html: string }>
): Promise<EmailResponse[]> {
  const results = await Promise.all(
    emails.map(email => sendEmail(email.to, email.subject, email.html))
  );
  return results;
}

// Helper to queue email in database (for retry mechanism)
export async function queueEmail(
  toEmail: string,
  subject: string,
  templateName: string,
  templateData: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_queue')
      .insert({
        to_email: toEmail,
        subject,
        template_name: templateName,
        template_data: templateData,
        status: 'pending',
        attempts: 0
      });

    if (error) {
      console.error('Queue email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Queue email exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
