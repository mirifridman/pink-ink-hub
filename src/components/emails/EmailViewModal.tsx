import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Mail, 
  Paperclip, 
  Download, 
  FileText, 
  FileImage, 
  File, 
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { supabase } from '@/integrations/supabase/client';
import { useEmailReplies } from '@/hooks/useEmailReplies';
import type { Email } from '@/hooks/useEmails';

interface EmailViewModalProps {
  emailId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailViewModal({ emailId, open, onOpenChange }: EmailViewModalProps) {
  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  
  const { data: replies = [], isLoading: isLoadingReplies } = useEmailReplies(emailId);

  // Fetch email when modal opens - check both emails and incoming_emails tables
  // Also supports external_id lookup for tasks created via n8n
  useEffect(() => {
    const fetchEmail = async () => {
      if (!emailId || !open) {
        setEmail(null);
        return;
      }

      setIsLoading(true);
      
      // First try the emails table by id
      let { data: emailData } = await supabase
        .from('emails')
        .select('*')
        .eq('id', emailId)
        .maybeSingle();

      // If not found by id, try by external_id (for tasks created via n8n)
      if (!emailData) {
        const { data: externalData } = await supabase
          .from('emails')
          .select('*')
          .eq('external_id', emailId)
          .maybeSingle();
        emailData = externalData;
      }

      if (emailData) {
        setEmail(emailData as Email);
        setIsLoading(false);
        return;
      }

      // If not found in emails, try incoming_emails table
      const { data: incomingData } = await supabase
        .from('incoming_emails')
        .select('*')
        .eq('id', emailId)
        .maybeSingle();

      if (incomingData) {
        // Convert incoming_emails format to Email format
        const convertedEmail: Email = {
          id: incomingData.id,
          sender_name: incomingData.sender_name,
          sender_address: incomingData.sender_email,
          subject: incomingData.subject,
          body_text: incomingData.content,
          body_html: null,
          received_at: incomingData.received_at,
          status: incomingData.is_processed ? 'processed' : 'new',
          attachment_urls: [],
          created_at: incomingData.created_at,
          created_task_id: incomingData.created_task_id,
          external_id: incomingData.external_id || null,
          is_read: true,
        };
        setEmail(convertedEmail);
      }
      
      setIsLoading(false);
    };

    fetchEmail();
  }, [emailId, open]);

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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !email ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">לא נמצא מייל</p>
            </div>
          ) : (
            <>
              {/* Email Header */}
              <DialogHeader className="p-6 border-b border-border">
                <DialogTitle className="text-xl font-bold text-foreground text-right">
                  {email.subject}
                </DialogTitle>
                <div className="flex items-center gap-3 text-sm mt-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {email.sender_name.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-medium text-foreground">{email.sender_name}</p>
                    {email.sender_address && (
                      <p className="text-muted-foreground text-xs">{email.sender_address}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(email.received_at), 'EEEE, dd MMMM yyyy בשעה HH:mm', { locale: he })}
                  </p>
                </div>
              </DialogHeader>

              {/* Email Body */}
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

                {/* Replies */}
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
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        open={!!selectedAttachment}
        onOpenChange={(open) => !open && setSelectedAttachment(null)}
        attachmentPath={selectedAttachment}
      />
    </>
  );
}
