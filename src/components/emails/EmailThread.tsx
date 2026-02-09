import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { User, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmailReply } from '@/hooks/useEmailReplies';
import type { Email } from '@/hooks/useEmails';

interface EmailThreadProps {
  email: Email;
  replies: EmailReply[];
  isLoading?: boolean;
}

export function EmailThread({ email, replies, isLoading }: EmailThreadProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Original Email */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-start gap-3 p-4 bg-muted/30 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {email.sender_name.slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{email.sender_name}</span>
                {email.sender_address && (
                  <span className="text-sm text-muted-foreground">
                    &lt;{email.sender_address}&gt;
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(email.received_at), 'HH:mm dd/MM/yyyy', { locale: he })}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">אל: לשכת מנכ"ל</span>
            </div>
          </div>
        </div>
        <div className="p-4">
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
      </div>

      {/* Replies */}
      {replies.map((reply) => (
        <div 
          key={reply.id} 
          className="bg-card border border-primary/20 rounded-lg overflow-hidden mr-8"
        >
          <div className="flex items-start gap-3 p-4 bg-primary/5 border-b border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">אתה</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                    תגובה
                  </span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(reply.sent_at), 'HH:mm dd/MM/yyyy', { locale: he })}
                </span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-foreground whitespace-pre-wrap">
              {reply.reply_text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
