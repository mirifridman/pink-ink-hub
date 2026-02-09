import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { sendTaskAssignmentNotifications } from '@/hooks/useTaskNotifications';

type TaskPriority = Database['public']['Enums']['task_priority'];
type TaskStatus = Database['public']['Enums']['task_status'];
type ApprovalStatus = Database['public']['Enums']['approval_status'];

export interface IncomingEmail {
  id: string;
  sender_name: string;
  sender_email: string | null;
  subject: string;
  content: string | null;
  sent_at: string;
  received_at: string;
  is_processed: boolean;
  created_task_id: string | null;
  created_at: string;
}

export interface ConvertEmailOptions {
  priority: TaskPriority;
  status: TaskStatus;
  assignees: string[];
  approvalType: 'manual' | 'request' | 'none';
  approvalUserId?: string;
  title?: string;
  description?: string;
}

export function useIncomingEmails(includeProcessed = false) {
  return useQuery({
    queryKey: ['incoming-emails', includeProcessed],
    queryFn: async () => {
      let query = supabase
        .from('incoming_emails')
        .select('*')
        .order('sent_at', { ascending: false });

      if (!includeProcessed) {
        query = query.eq('is_processed', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IncomingEmail[];
    },
  });
}

export function useConvertEmailToTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, options }: { email: IncomingEmail; options: ConvertEmailOptions }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Determine approval status based on conversion type
      let approvalStatus: ApprovalStatus = 'pending';
      let approvedBy: string | null = null;
      let approvedAt: string | null = null;
      let taskStatus: TaskStatus = options.status;

      if (options.approvalType === 'manual') {
        approvalStatus = 'approved';
        approvedBy = userId || null;
        approvedAt = new Date().toISOString();
        taskStatus = 'approved';
      }

      // Create task from email - use edited title/description if provided
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: options.title || email.subject,
          description: options.description ?? email.content,
          source: 'email',
          source_reference: email.id,
          priority: options.priority,
          status: taskStatus,
          approval_status: approvalStatus,
          approved_by: approvedBy,
          approved_at: approvedAt,
          created_by: userId,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Add assignees if any
      if (options.assignees.length > 0) {
        const assigneesData = options.assignees.map(empId => ({
          task_id: task.id,
          employee_id: empId,
          assigned_by: userId,
        }));

        const { error: assigneesError } = await supabase
          .from('task_assignees')
          .insert(assigneesData);

        if (assigneesError) throw assigneesError;

        // Send push notifications to assigned employees
        sendTaskAssignmentNotifications(task.id, options.title || email.subject, options.assignees);
      }

      // Mark email as processed
      const { error: updateError } = await supabase
        .from('incoming_emails')
        .update({
          is_processed: true,
          created_task_id: task.id,
        })
        .eq('id', email.id);

      if (updateError) throw updateError;

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-emails'] });
      queryClient.invalidateQueries({ queryKey: ['incoming-emails-count'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['attention-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completed-tasks-count'] });
    },
  });
}

export function useDeleteIncomingEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('incoming_emails')
        .delete()
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-emails'] });
      queryClient.invalidateQueries({ queryKey: ['incoming-emails-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
