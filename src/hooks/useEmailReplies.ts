import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmailReply {
  id: string;
  email_id: string;
  reply_text: string;
  sent_at: string;
  sent_by: string | null;
  created_at: string;
}

export function useEmailReplies(emailId: string | null) {
  return useQuery({
    queryKey: ['email-replies', emailId],
    queryFn: async () => {
      if (!emailId) return [];
      
      const { data, error } = await supabase
        .from('email_replies')
        .select('*')
        .eq('email_id', emailId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      return data as EmailReply[];
    },
    enabled: !!emailId,
  });
}

export function useAddEmailReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emailId, replyText }: { emailId: string; replyText: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('email_replies')
        .insert({
          email_id: emailId,
          reply_text: replyText,
          sent_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-replies', variables.emailId] });
    },
  });
}
