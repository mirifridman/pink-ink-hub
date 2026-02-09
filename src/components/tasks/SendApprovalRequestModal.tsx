import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Loader2, Send } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];

// Accept either full TaskWithDetails or minimal task info for email conversion flow
type TaskInfo = TaskWithDetails | { id: string; title: string; description?: string | null };

interface SendApprovalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskInfo | null;
}

export function SendApprovalRequestModal({ isOpen, onClose, task }: SendApprovalRequestModalProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [message, setMessage] = useState('');

  // Fetch employees (team members) who can approve
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-for-approval'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, user_id')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const sendApprovalRequestMutation = useMutation({
    mutationFn: async () => {
      if (!task?.id || !selectedUserId) throw new Error('Missing required data');

      // Get selected employee details
      const selectedEmployee = employees?.find(e => e.id === selectedUserId);
      if (!selectedEmployee?.email) throw new Error('Selected employee has no email');

      // Create approval request in database
      const { data: approvalRequest, error: dbError } = await supabase
        .from('task_approval_requests')
        .insert({
        task_id: task.id,
        requested_by: user?.id || '',
        requested_to: selectedEmployee.user_id || user?.id || '',
        message: message.trim() || null,
      })
        .select('token')
        .single();

      if (dbError) throw dbError;

      // Update task approval status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ approval_status: 'request_sent' })
        .eq('id', task.id);

      if (taskError) throw taskError;

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'approval_request',
          recipientEmail: selectedEmployee.email,
          recipientName: selectedEmployee.full_name,
          taskId: task.id,
          taskTitle: task.title,
          senderName: profile?.full_name || profile?.email || 'משתמש',
          message: message.trim() || undefined,
          approvalToken: approvalRequest.token,
          sentBy: user?.id,
        },
      });

      if (emailError) throw emailError;

      // Log the action
      await supabase.rpc('log_action', {
        p_user_id: user?.id || '',
        p_action: 'create',
        p_entity_type: 'approval_request',
        p_entity_id: task.id,
        p_details: { 
          requested_to: selectedEmployee.user_id,
          requested_to_name: selectedEmployee.full_name,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-tasks'] });
      toast.success('בקשת האישור נשלחה בהצלחה');
      handleClose();
    },
    onError: (error: Error) => {
      console.error('Error sending approval request:', error);
      toast.error('שגיאה בשליחת הבקשה');
    },
  });

  const handleClose = () => {
    setSelectedUserId('');
    setMessage('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedUserId) {
      toast.error('יש לבחור איש צוות');
      return;
    }
    sendApprovalRequestMutation.mutate();
  };

  const isLoading = sendApprovalRequestMutation.isPending;

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Mail className="h-5 w-5 text-primary" />
            שליחת בקשת אישור
          </DialogTitle>
          <DialogDescription className="text-right">
            שלח בקשה לאיש צוות לאישור המשימה
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-medium">{task.title}</p>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label>שלח ל *</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={employeesLoading ? 'טוען...' : 'בחר איש צוות'} />
              </SelectTrigger>
              <SelectContent>
                {employees?.filter(e => e.email).map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <span>{emp.full_name || emp.email}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="approval-message">הערה (אופציונלי)</Label>
            <Textarea
              id="approval-message"
              placeholder="הוסף הערה לבקשה..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Info Note */}
          <p className="text-xs text-muted-foreground">
            * איש הצוות יקבל אימייל עם קישור לאישור המשימה. הקישור בתוקף ל-7 ימים.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedUserId}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            שלח בקשה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
