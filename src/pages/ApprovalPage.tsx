import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { he } from 'date-fns/locale';
import { Check, X, Loader2, Clock, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

interface ApprovalRequest {
  id: string;
  task_id: string;
  message: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  task: {
    title: string;
    description: string | null;
    priority: string;
    project: { name: string } | null;
  } | null;
  requester: {
    full_name: string | null;
    email: string;
  } | null;
}

export default function ApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!token) {
        setError('קישור לא תקין');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('task_approval_requests')
        .select(`
          id,
          task_id,
          message,
          status,
          expires_at,
          created_at,
          task:tasks (
            title,
            description,
            priority,
            project:projects (name)
          ),
          requester:profiles!task_approval_requests_requested_by_fkey (
            full_name,
            email
          )
        `)
        .eq('token', token)
        .maybeSingle();

      if (error) {
        console.error('Error fetching request:', error);
        setError('אירעה שגיאה בטעינת הבקשה');
      } else if (!data) {
        setError('בקשה לא נמצאה או שהקישור פג תוקף');
      } else {
        setRequest(data as unknown as ApprovalRequest);
      }

      setIsLoading(false);
    };

    fetchRequest();
  }, [token]);

  const isExpired = request?.expires_at ? isPast(new Date(request.expires_at)) : false;
  const isAlreadyResponded = request?.status !== 'pending';

  const handleApprove = async () => {
    if (!request) return;

    setIsSubmitting(true);

    try {
      // Update approval request
      const { error: requestError } = await supabase
        .from('task_approval_requests')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Update task
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          approval_status: 'approved',
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', request.task_id);

      if (taskError) throw taskError;

      toast({ title: 'המשימה אושרה בהצלחה!' });
      setRequest({ ...request, status: 'approved' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    if (!rejectionReason.trim()) {
      toast({ title: 'שגיאה', description: 'נא להזין סיבת דחייה', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update approval request
      const { error: requestError } = await supabase
        .from('task_approval_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Update task
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          approval_status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', request.task_id);

      if (taskError) throw taskError;

      toast({ title: 'המשימה נדחתה' });
      setRequest({ ...request, status: 'rejected' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: 'נמוכה', className: 'bg-muted text-muted-foreground' },
    medium: { label: 'בינונית', className: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
    high: { label: 'גבוהה', className: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' },
    urgent: { label: 'דחופה', className: 'bg-red-500/20 text-red-600 dark:text-red-400' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">שגיאה</h2>
            <p className="text-muted-foreground mb-6">{error || 'בקשה לא נמצאה'}</p>
            <Button onClick={() => navigate('/login')}>חזרה לעמוד הבית</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4" dir="rtl">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">בקשת אישור משימה</CardTitle>
          <CardDescription>
            {request.requester?.full_name || request.requester?.email} מבקש/ת את אישורך
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Messages */}
          {isAlreadyResponded && (
            <div className={`p-4 rounded-lg text-center ${
              request.status === 'approved' 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              {request.status === 'approved' ? (
                <>
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-green-400 font-medium">המשימה כבר אושרה</p>
                </>
              ) : (
                <>
                  <X className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <p className="text-red-400 font-medium">המשימה נדחתה</p>
                </>
              )}
            </div>
          )}

          {isExpired && !isAlreadyResponded && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
              <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-yellow-400 font-medium">פג תוקף הבקשה</p>
              <p className="text-sm text-muted-foreground">נא לבקש קישור חדש</p>
            </div>
          )}

          {/* Task Details */}
          <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{request.task?.title}</h3>
              <Badge className={priorityConfig[request.task?.priority || 'medium'].className}>
                {priorityConfig[request.task?.priority || 'medium'].label}
              </Badge>
            </div>

            {request.task?.description && (
              <p className="text-muted-foreground text-sm">{request.task.description}</p>
            )}

            {request.task?.project?.name && (
              <p className="text-sm">
                <span className="text-muted-foreground">פרויקט: </span>
                {request.task.project.name}
              </p>
            )}
          </div>

          {/* Sender Message */}
          {request.message && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">הודעה מהשולח:</p>
              <p className="italic">"{request.message}"</p>
            </div>
          )}

          {/* Expiry Info */}
          {!isAlreadyResponded && !isExpired && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                בתוקף עוד{' '}
                {formatDistanceToNow(new Date(request.expires_at), { locale: he })}
              </span>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          {!isAlreadyResponded && !isExpired && (
            <>
              {showRejectForm ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">סיבת דחייה *</Label>
                    <Textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="הזן את סיבת הדחייה..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectForm(false)}
                      className="flex-1"
                    >
                      ביטול
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 ml-2" />
                          אשר דחייה
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 ml-2" />
                    דחה
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 ml-2" />
                        אשר משימה
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            מטה מנכ״ל - מערכת ניהול משימות ופרויקטים
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
