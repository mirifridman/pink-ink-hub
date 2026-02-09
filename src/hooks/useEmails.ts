import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EmailStatus = 'new' | 'processed' | 'archived';
export type EmailCategory = 'inbox' | 'outbox' | 'archived';

export interface Email {
  id: string;
  external_id: string | null;
  sender_name: string;
  sender_address: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  received_at: string;
  status: EmailStatus;
  attachment_urls: string[];
  created_at: string;
  created_task_id: string | null;
  is_read: boolean;
}

export function useEmails(category?: EmailCategory, searchQuery?: string) {
  return useQuery({
    queryKey: ['emails', category, searchQuery],
    queryFn: async () => {
      // For inbox, we need to exclude:
      // 1. Emails that have replies (those are in outbox)
      // 2. Emails from the automation sender (mancal) - these are sent replies that got captured
      if (category === 'inbox') {
        // First get all email IDs that have replies (outbox emails)
        const { data: replies } = await supabase
          .from('email_replies')
          .select('email_id');
        
        const outboxEmailIds = replies ? [...new Set(replies.map(r => r.email_id))] : [];

        let query = supabase
          .from('emails')
          .select('*')
          .neq('status', 'archived')
          .neq('sender_name', 'mancal') // Exclude automation-sent emails
          .order('received_at', { ascending: false });

        // Exclude emails that are in the outbox (have replies)
        if (outboxEmailIds.length > 0) {
          query = query.not('id', 'in', `(${outboxEmailIds.join(',')})`);
        }

        if (searchQuery && searchQuery.trim()) {
          const search = searchQuery.trim();
          query = query.or(
            `sender_name.ilike.%${search}%,sender_address.ilike.%${search}%,subject.ilike.%${search}%,body_text.ilike.%${search}%`
          );
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Email[];
      }

      // Archived category
      let query = supabase
        .from('emails')
        .select('*')
        .eq('status', 'archived')
        .order('received_at', { ascending: false });

      if (searchQuery && searchQuery.trim()) {
        const search = searchQuery.trim();
        query = query.or(
          `sender_name.ilike.%${search}%,sender_address.ilike.%${search}%,subject.ilike.%${search}%,body_text.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Email[];
    },
    enabled: category !== 'outbox', // Don't run for outbox - handled separately
  });
}

export function useOutboxEmails(searchQuery?: string) {
  return useQuery({
    queryKey: ['outbox-emails', searchQuery],
    queryFn: async () => {
      // Get all email IDs that have replies
      const { data: replies, error: repliesError } = await supabase
        .from('email_replies')
        .select('email_id')
        .order('sent_at', { ascending: false });

      if (repliesError) throw repliesError;

      if (!replies || replies.length === 0) return [];

      // Get unique email IDs
      const emailIds = [...new Set(replies.map(r => r.email_id))];

      let query = supabase
        .from('emails')
        .select('*')
        .in('id', emailIds)
        .order('received_at', { ascending: false });

      if (searchQuery && searchQuery.trim()) {
        const search = searchQuery.trim();
        query = query.or(
          `sender_name.ilike.%${search}%,sender_address.ilike.%${search}%,subject.ilike.%${search}%,body_text.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Email[];
    },
  });
}

export function useEmailCounts() {
  return useQuery({
    queryKey: ['email-counts'],
    queryFn: async () => {
      // Get all email IDs that have replies (outbox emails)
      const { data: outboxReplies } = await supabase
        .from('email_replies')
        .select('email_id');

      const outboxEmailIds = outboxReplies 
        ? [...new Set(outboxReplies.map(r => r.email_id))] 
        : [];

      // Count inbox: UNREAD non-archived emails that are NOT in outbox and NOT from automation
      let inboxQuery = supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('status', 'archived')
        .neq('sender_name', 'mancal'); // Exclude automation-sent emails

      if (outboxEmailIds.length > 0) {
        inboxQuery = inboxQuery.not('id', 'in', `(${outboxEmailIds.join(',')})`);
      }

      const [inboxCount, archivedCount] = await Promise.all([
        inboxQuery,
        supabase.from('emails').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
      ]);

      return {
        inbox: inboxCount.count || 0,
        outbox: outboxEmailIds.length,
        archived: archivedCount.count || 0,
      };
    },
  });
}

export function useMarkEmailAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('emails')
        .update({ is_read: true })
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['outbox-emails'] });
    },
  });
}

export function useMarkEmailAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('emails')
        .update({ is_read: false })
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['outbox-emails'] });
    },
  });
}

export function useUpdateEmailStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emailId, status }: { emailId: string; status: EmailStatus }) => {
      const { error } = await supabase
        .from('emails')
        .update({ status })
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-counts'] });
    },
  });
}

export function useDeleteEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('emails')
        .delete()
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-counts'] });
    },
  });
}

export function useGenerateTaskFromEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: Email) => {
      console.log('Triggering n8n automation for email:', email.id);
      
      // Call the edge function to trigger n8n automation
      const { data, error } = await supabase.functions.invoke('trigger-email-automation', {
        body: {
          id: email.id,
          external_id: email.external_id,
          sender_name: email.sender_name,
          sender_address: email.sender_address,
          subject: email.subject,
          body_html: email.body_html,
          body_text: email.body_text,
          received_at: email.received_at,
          attachment_urls: email.attachment_urls,
        },
      });

      if (error) throw error;

      // Update email status to processed after successful trigger
      await supabase
        .from('emails')
        .update({ status: 'processed' as EmailStatus })
        .eq('id', email.id);

      return { success: true, message: data?.message || 'האוטומציה הופעלה בהצלחה' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-counts'] });
    },
  });
}
