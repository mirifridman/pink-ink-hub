import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Check, X, Send, Clock, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { ApprovalRequestModal } from './ApprovalRequestModal';
import type { Database } from '@/integrations/supabase/types';

type ApprovalStatus = Database['public']['Enums']['approval_status'];

interface ApprovalRequest {
  id: string;
  status: string;
  created_at: string;
  expires_at: string;
  token: string;
  requested_to_profile: {
    full_name: string | null;
    email: string;
  } | null;
}

interface TaskApprovalSectionProps {
  taskId: string;
  taskTitle: string;
  approvalStatus: ApprovalStatus | null;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedByName: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  onStatusChange: () => void;
}

export function TaskApprovalSection({
  taskId,
  taskTitle,
  approvalStatus,
  approvedByName,
  approvedAt,
  rejectedByName,
  rejectedAt,
  rejectionReason,
  onStatusChange,
}: TaskApprovalSectionProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState<ApprovalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const isAdmin = profile?.role === 'admin';

  // Fetch active approval request
  useEffect(() => {
    const fetchActiveRequest = async () => {
      const { data, error } = await supabase
        .from('task_approval_requests')
        .select(`
          id,
          status,
          created_at,
          expires_at,
          token,
          requested_to_profile:profiles!task_approval_requests_requested_to_fkey (
            full_name,
            email
          )
        `)
        .eq('task_id', taskId)
        .eq('status', 'pending')
        .maybeSingle();

      if (!error && data) {
        setActiveRequest(data as unknown as ApprovalRequest);
      } else {
        setActiveRequest(null);
      }
    };

    fetchActiveRequest();
  }, [taskId, approvalStatus]);

  const handleApproveByAdmin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          approval_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          status: 'approved',
        })
        .eq('id', taskId);

      if (error) throw error;

      // Cancel any pending requests
      await supabase
        .from('task_approval_requests')
        .update({ status: 'expired' })
        .eq('task_id', taskId)
        .eq('status', 'pending');

      toast({ title: 'המשימה אושרה בהצלחה' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onStatusChange();
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRequest) return;

    setIsLoading(true);
    try {
      const { error: requestError } = await supabase
        .from('task_approval_requests')
        .update({ status: 'expired' })
        .eq('id', activeRequest.id);

      if (requestError) throw requestError;

      const { error: taskError } = await supabase
        .from('tasks')
        .update({ approval_status: 'pending' })
        .eq('id', taskId);

      if (taskError) throw taskError;

      toast({ title: 'הבקשה בוטלה' });
      setActiveRequest(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onStatusChange();
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!activeRequest) return;

    setIsSendingReminder(true);
    try {
      const response = await supabase.functions.invoke('send-email', {
        body: {
          type: 'reminder',
          recipientEmail: activeRequest.requested_to_profile?.email,
          recipientName: activeRequest.requested_to_profile?.full_name,
          taskId,
          taskTitle,
          approvalToken: activeRequest.token,
          sentBy: user?.id,
        },
      });

      if (response.error) throw response.error;

      toast({ title: 'התזכורת נשלחה בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleResendRequest = () => {
    setShowRequestModal(true);
  };

  const daysUntilExpiry = activeRequest?.expires_at
    ? Math.ceil((new Date(activeRequest.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          <span className="font-medium">אישור משימה</span>
        </div>

        {/* Pending Status */}
        {approvalStatus === 'pending' && (
          <div className="space-y-3">
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              ממתין לאישור
            </Badge>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRequestModal(true)}
              >
                <Send className="h-4 w-4 ml-2" />
                בקש אישור מחבר צוות
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={handleApproveByAdmin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 ml-2" />
                      אשר משימה
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Request Sent Status */}
        {approvalStatus === 'request_sent' && activeRequest && (
          <div className="space-y-3">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              נשלחה בקשת אישור
            </Badge>
            <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">נשלח אל: </span>
                <span className="font-medium">
                  {activeRequest.requested_to_profile?.full_name || activeRequest.requested_to_profile?.email}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">בתאריך: </span>
                {format(new Date(activeRequest.created_at), 'd בMMM yyyy', { locale: he })}
              </p>
              <p className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-500">
                  בתוקף עוד {daysUntilExpiry} ימים
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReminder}
                disabled={isSendingReminder}
              >
                {isSendingReminder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 ml-2" />
                    שלח תזכורת
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelRequest}
                disabled={isLoading}
              >
                <X className="h-4 w-4 ml-2" />
                בטל בקשה
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={handleApproveByAdmin}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 ml-2" />
                  אשר בעצמי
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Approved Status */}
        {approvalStatus === 'approved' && (
          <div className="space-y-3">
            <Badge className="bg-green-500/20 text-green-400">
              מאושר
            </Badge>
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
              <p>
                <span className="text-muted-foreground">אושר על ידי: </span>
                <span className="font-medium text-green-400">{approvedByName || 'לא ידוע'}</span>
              </p>
              {approvedAt && (
                <p>
                  <span className="text-muted-foreground">בתאריך: </span>
                  {format(new Date(approvedAt), "d בMMM yyyy 'בשעה' HH:mm", { locale: he })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Rejected Status */}
        {approvalStatus === 'rejected' && (
          <div className="space-y-3">
            <Badge className="bg-red-500/20 text-red-400">
              נדחה
            </Badge>
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">נדחה על ידי: </span>
                <span className="font-medium text-red-400">{rejectedByName || 'לא ידוע'}</span>
              </p>
              {rejectedAt && (
                <p>
                  <span className="text-muted-foreground">בתאריך: </span>
                  {format(new Date(rejectedAt), "d בMMM yyyy 'בשעה' HH:mm", { locale: he })}
                </p>
              )}
              {rejectionReason && (
                <p>
                  <span className="text-muted-foreground">סיבה: </span>
                  "{rejectionReason}"
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendRequest}
            >
              <Send className="h-4 w-4 ml-2" />
              שלח שוב לאישור
            </Button>
          </div>
        )}
      </div>

      {/* Approval Request Modal */}
      <ApprovalRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        taskId={taskId}
        taskTitle={taskTitle}
      />
    </>
  );
}
