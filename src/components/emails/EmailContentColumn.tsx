import { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Mail, 
  Paperclip, 
  Download, 
  FileText, 
  FileImage, 
  File, 
  Loader2,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { supabase } from '@/integrations/supabase/client';
import { useEmailReplies, useAddEmailReply } from '@/hooks/useEmailReplies';
import type { Email } from '@/hooks/useEmails';

interface EmailContentColumnProps {
  email: Email | null;
}

export function EmailContentColumn({ email }: EmailContentColumnProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const { toast } = useToast();
  
  const { data: replies = [], isLoading: isLoadingReplies } = useEmailReplies(email?.id || null);
  const addReply = useAddEmailReply();

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background/50 rounded-xl">
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

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return <FileText className="h-5 w-5 text-red-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <FileImage className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'קובץ';
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
      {/* Email Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-3">
          {email.subject}
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">
              {email.sender_name.slice(0, 2)}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{email.sender_name}</p>
            {email.sender_address && (
              <p className="text-muted-foreground text-xs">{email.sender_address}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(email.received_at), 'EEEE, dd MMMM yyyy בשעה HH:mm', { locale: he })}
          </p>
        </div>
      </div>

      {/* Email Body - Thread Style */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Original Email */}
        <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
          {email.body_html ? (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none [&_*]:max-w-none break-words"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              dangerouslySetInnerHTML={{ __html: email.body_html }}
            />
          ) : (
            <p className="text-foreground whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>
              {email.body_text || 'אין תוכן להודעה זו'}
            </p>
          )}
        </div>

        {/* Replies - Stacked with offset */}
        {isLoadingReplies ? (
          <div className="mt-4 mr-6 animate-pulse">
            <div className="h-24 bg-muted rounded-xl" />
          </div>
        ) : (
          replies.map((reply) => (
            <div 
              key={reply.id} 
              className="mt-4 mr-6 bg-primary/5 rounded-xl p-5 border border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-foreground">אתה</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">תגובה שלך</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(reply.sent_at), 'HH:mm dd/MM/yyyy', { locale: he })}
                </span>
              </div>
              <p className="text-foreground whitespace-pre-wrap">
                {reply.reply_text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Attachment Bar */}
      {email.attachment_urls && email.attachment_urls.length > 0 && (
        <>
          <Separator />
          <div className="p-4 bg-muted/20">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              קבצים מצורפים ({email.attachment_urls.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {email.attachment_urls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 bg-card rounded-lg border border-border/50 min-w-[200px] group hover:border-primary/30 transition-colors"
                >
                  {getFileIcon(url)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getFileName(url)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedAttachment(url)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Quick Reply - at the bottom */}
      <Separator />
      <div className="p-4 bg-muted/10">
        {showReply ? (
          <div className="space-y-3">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="כתוב את תשובתך כאן..."
              className="min-h-[100px] bg-card"
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
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setShowReply(true)}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            תגובה מהירה
          </Button>
        )}
      </div>

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        open={!!selectedAttachment}
        onOpenChange={(open) => !open && setSelectedAttachment(null)}
        attachmentPath={selectedAttachment}
      />
    </div>
  );
}
