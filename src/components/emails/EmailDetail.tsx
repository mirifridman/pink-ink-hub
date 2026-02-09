import { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Sparkles, 
  Reply, 
  Archive, 
  Trash2, 
  Paperclip, 
  CheckCircle,
  Mail,
  FileText,
  Loader2,
  Send,
  ListTodo,
  MailOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { EmailThread } from './EmailThread';
import { TaskEditModal, EmailToTaskData } from '@/components/tasks/TaskEditModal';
import { supabase } from '@/integrations/supabase/client';
import { useEmailReplies, useAddEmailReply } from '@/hooks/useEmailReplies';
import { useMarkEmailAsUnread } from '@/hooks/useEmails';
import type { Email, EmailStatus } from '@/hooks/useEmails';

interface EmailDetailProps {
  email: Email | null;
  onGenerateTask: (email: Email) => void;
  onUpdateStatus: (emailId: string, status: EmailStatus) => void;
  onDelete: (emailId: string) => void;
  isGenerating?: boolean;
}

export function EmailDetail({ 
  email, 
  onGenerateTask, 
  onUpdateStatus, 
  onDelete,
  isGenerating 
}: EmailDetailProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { toast } = useToast();
  
  const { data: replies = [], isLoading: isLoadingReplies } = useEmailReplies(email?.id || null);
  const addReply = useAddEmailReply();
  const markAsUnread = useMarkEmailAsUnread();

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Mail className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-lg">בחר הודעה לצפייה</p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          בחר הודעה מהרשימה כדי לראות את הפרטים שלה
        </p>
      </div>
    );
  }

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין תוכן לתשובה',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingReply(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-reply', {
        body: {
          email_id: email.id,
          original_external_id: email.external_id,
          original_subject: email.subject,
          original_sender_name: email.sender_name,
          original_sender_address: email.sender_address,
          reply_text: replyText,
        },
      });

      if (error) throw error;

      // Save reply locally
      await addReply.mutateAsync({
        emailId: email.id,
        replyText: replyText,
      });

      toast({
        title: 'התשובה נשלחה',
        description: data?.message || 'התשובה נשלחה בהצלחה',
      });
      setShowReply(false);
      setReplyText('');
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את התשובה',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusBadge = (status: EmailStatus) => {
    const statusConfig = {
      new: { label: 'חדש', variant: 'default' as const },
      processed: { label: 'טופל', variant: 'secondary' as const },
      archived: { label: 'ארכיון', variant: 'outline' as const },
    };
    return statusConfig[status];
  };

  const statusBadge = getStatusBadge(email.status);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-foreground truncate">
                {email.subject}
              </h2>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{email.sender_name}</span>
              {email.sender_address && (
                <>
                  <span>•</span>
                  <span>{email.sender_address}</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(email.received_at), 'EEEE, dd MMMM yyyy בשעה HH:mm', { locale: he })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={() => onGenerateTask(email)}
            disabled={isGenerating}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? 'מייצר משימה...' : 'צור משימה עם AI'}
          </Button>

          <Button 
            variant="outline"
            onClick={() => setShowTaskModal(true)}
            className="gap-2"
          >
            <ListTodo className="h-4 w-4" />
            צור משימה
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setShowReply(!showReply)}
            className="gap-2"
          >
            <Reply className="h-4 w-4" />
            השב
          </Button>

          {email.status === 'new' && (
            <Button 
              variant="outline" 
              onClick={() => onUpdateStatus(email.id, 'processed')}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              סמן כטופל
            </Button>
          )}

          {email.is_read && (
            <Button 
              variant="outline" 
              onClick={() => {
                markAsUnread.mutate(email.id, {
                  onSuccess: () => {
                    toast({
                      title: 'הודעה סומנה כלא נקראה',
                    });
                  }
                });
              }}
              className="gap-2"
            >
              <MailOpen className="h-4 w-4" />
              סמן כלא נקרא
            </Button>
          )}

          {email.status !== 'archived' && (
            <Button 
              variant="outline" 
              onClick={() => onUpdateStatus(email.id, 'archived')}
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              העבר לארכיון
            </Button>
          )}

          <Button 
            variant="ghost" 
            onClick={() => onDelete(email.id)}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            מחק
          </Button>
        </div>
      </div>

      {/* Reply Area */}
      {showReply && (
        <div className="p-4 border-b border-border bg-muted/30">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="כתוב את תשובתך כאן..."
            className="min-h-[120px] mb-3"
          />
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleReply} 
              size="sm" 
              disabled={isSendingReply || !replyText.trim()}
              className="gap-2"
            >
              {isSendingReply ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSendingReply ? 'שולח...' : 'שלח תשובה'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setShowReply(false);
                setReplyText('');
              }}
              disabled={isSendingReply}
            >
              ביטול
            </Button>
          </div>
        </div>
      )}

      {/* Body - Thread View */}
      <div className="flex-1 overflow-y-auto p-6">
        <EmailThread 
          email={email} 
          replies={replies} 
          isLoading={isLoadingReplies} 
        />
      </div>

      {/* Attachments */}
      {email.attachment_urls && email.attachment_urls.length > 0 && (
        <>
          <Separator />
          <div className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              קבצים מצורפים ({email.attachment_urls.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {email.attachment_urls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAttachment(url)}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate max-w-[200px]">
                    {url.split('/').pop() || `קובץ ${index + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        open={!!selectedAttachment}
        onOpenChange={(open) => !open && setSelectedAttachment(null)}
        attachmentPath={selectedAttachment}
      />

      {/* Task Creation Modal */}
      <TaskEditModal
        task={null}
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        mode="create"
        emailData={{
          title: email.subject,
          description: email.body_text || email.body_html?.replace(/<[^>]*>/g, '') || '',
          contactName: email.sender_name,
          contactEmail: email.sender_address || undefined,
          attachmentUrls: email.attachment_urls || [],
          sourceReference: email.id,
        }}
        onTaskCreated={() => {
          // Mark email as processed after task creation
          onUpdateStatus(email.id, 'processed');
        }}
      />
    </div>
  );
}
