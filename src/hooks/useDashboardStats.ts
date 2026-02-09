import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useUnreadEmailsCount() {
  return useQuery({
    queryKey: ['unread-emails-count'],
    queryFn: async () => {
      // Get all email IDs that have replies (outbox emails)
      const { data: outboxReplies } = await supabase
        .from('email_replies')
        .select('email_id');

      const outboxEmailIds = outboxReplies 
        ? [...new Set(outboxReplies.map(r => r.email_id))] 
        : [];

      // Count inbox unread: same logic as sidebar and email center tabs
      let query = supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('status', 'archived')
        .neq('sender_name', 'mancal');

      if (outboxEmailIds.length > 0) {
        query = query.not('id', 'in', `(${outboxEmailIds.join(',')})`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useIncomingEmailsCount() {
  return useQuery({
    queryKey: ['incoming-emails-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('incoming_emails')
        .select('*', { count: 'exact', head: true })
        .eq('is_processed', false);

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useCompletedTasksCount() {
  return useQuery({
    queryKey: ['completed-tasks-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          details,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });
}

export function useAttentionTasks() {
  return useQuery({
    queryKey: ['attention-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks_with_details')
        .select('*')
        .or('priority.eq.urgent,status.eq.stuck,approval_status.eq.pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });
}

// Pending approval tasks sorted by priority (urgent first)
export function usePendingApprovalTasks() {
  return useQuery({
    queryKey: ['pending-approval-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks_with_details')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Sort by priority: urgent > high > medium > low
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (data || []).sort((a, b) => {
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
        return aPriority - bPriority;
      });
    },
  });
}

export function useRecentTasks(limit = 15) {
  return useQuery({
    queryKey: ['recent-tasks', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks_with_details')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

export function useStuckTasksCount() {
  return useQuery({
    queryKey: ['stuck-tasks-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'stuck');

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useActiveProjects() {
  return useQuery({
    queryKey: ['active-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects_with_stats')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });
}
