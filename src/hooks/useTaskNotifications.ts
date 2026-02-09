import { supabase } from '@/integrations/supabase/client';

/**
 * Sends push notifications to assigned employees when a task is assigned
 */
export async function sendTaskAssignmentNotifications(
  taskId: string,
  taskTitle: string,
  employeeIds: string[]
) {
  if (employeeIds.length === 0) return;

  try {
    // Get user_ids for the assigned employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('user_id')
      .in('id', employeeIds)
      .not('user_id', 'is', null);

    if (empError || !employees) {
      console.error('Error fetching employee user_ids:', empError);
      return;
    }

    const userIds = employees
      .map(emp => emp.user_id)
      .filter((id): id is string => id !== null);

    if (userIds.length === 0) {
      console.log('No users to notify (employees not linked to users)');
      return;
    }

    // Send push notification
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      console.log('No session for sending notifications');
      return;
    }

    const response = await supabase.functions.invoke('send-push', {
      body: {
        userIds,
        title: 'משימה חדשה הוקצתה לך',
        body: taskTitle,
        url: `/tasks?task=${taskId}`,
        tag: 'task-assignment',
      },
    });

    if (response.error) {
      console.error('Error sending push notification:', response.error);
    } else {
      console.log('Push notifications sent:', response.data);
    }
  } catch (error) {
    console.error('Error in sendTaskAssignmentNotifications:', error);
  }
}
