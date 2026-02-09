import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];

interface TaskApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskWithDetails | null;
}

export function TaskApprovalModal({ isOpen, onClose, task }: TaskApprovalModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const approveTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task?.id) throw new Error('No task selected');
      
      const { error } = await supabase
        .from('tasks')
        .update({
          approval_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          status: 'approved',
          description: note 
            ? `${task.description || ''}\n\n---\nהערת אישור: ${note}`.trim() 
            : task.description,
        })
        .eq('id', task.id);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_action', {
        p_user_id: user?.id || '',
        p_action: 'approve',
        p_entity_type: 'task',
        p_entity_id: task.id,
        p_details: { note: note || null },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approval-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['attention-tasks'] });
      toast.success('המשימה אושרה בהצלחה');
      handleClose();
    },
    onError: () => {
      toast.error('שגיאה באישור המשימה');
    },
  });

  const rejectTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task?.id) throw new Error('No task selected');
      if (!note.trim()) throw new Error('Rejection reason is required');
      
      const { error } = await supabase
        .from('tasks')
        .update({
          approval_status: 'rejected',
          rejected_by: user?.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: note,
        })
        .eq('id', task.id);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_action', {
        p_user_id: user?.id || '',
        p_action: 'reject',
        p_entity_type: 'task',
        p_entity_id: task.id,
        p_details: { reason: note },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approval-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['attention-tasks'] });
      toast.success('המשימה נדחתה');
      handleClose();
    },
    onError: (error: Error) => {
      if (error.message === 'Rejection reason is required') {
        toast.error('יש להזין סיבת דחייה');
      } else {
        toast.error('שגיאה בדחיית המשימה');
      }
    },
  });

  const handleClose = () => {
    setNote('');
    setAction(null);
    onClose();
  };

  const handleApprove = () => {
    setAction('approve');
    approveTaskMutation.mutate();
  };

  const handleReject = () => {
    if (!note.trim()) {
      toast.error('יש להזין סיבת דחייה');
      return;
    }
    setAction('reject');
    rejectTaskMutation.mutate();
  };

  const isLoading = approveTaskMutation.isPending || rejectTaskMutation.isPending;

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">אישור/דחיית משימה</DialogTitle>
          <DialogDescription className="text-right">
            {task.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Info */}
          {task.description && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {task.description}
              </p>
            </div>
          )}

          {/* Note Input */}
          <div className="space-y-2">
            <Label htmlFor="approval-note">
              הערה (חובה בדחייה)
            </Label>
            <Textarea
              id="approval-note"
              placeholder="הזן הערה או סיבת דחייה..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
          </div>
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
            variant="destructive"
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            {isLoading && action === 'reject' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            דחה
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isLoading}
            className="flex-1 gap-2 bg-emerald-500 hover:bg-emerald-600"
          >
            {isLoading && action === 'approve' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            אשר
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
