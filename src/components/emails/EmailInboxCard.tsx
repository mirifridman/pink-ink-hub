import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Paperclip, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/hooks/useEmails';

interface EmailInboxCardProps {
  email: Email;
  isSelected: boolean;
  onSelect: (email: Email) => void;
  hasLinkedTasks?: boolean;
}

export function EmailInboxCard({ email, isSelected, onSelect, hasLinkedTasks = false }: EmailInboxCardProps) {
  // Check if email has tasks - either via created_task_id or passed from parent
  const hasTask = !!email.created_task_id || hasLinkedTasks;
  const hasAttachments = email.attachment_urls && email.attachment_urls.length > 0;
  const isUnread = !email.is_read;

  // Prefer a stable sender identifier (some integrations may not provide a usable name)
  const senderDisplay =
    email.sender_name?.trim() || email.sender_address?.trim() || 'שולח לא ידוע';

  const subjectDisplay = email.subject?.trim() || '(ללא נושא)';
  
  // Get body snippet
  const bodySnippet = (email.body_text || email.body_html?.replace(/<[^>]*>/g, '') || '')
    .substring(0, 80)
    .trim();

  return (
    <button
      onClick={() => onSelect(email)}
      className={cn(
        'relative w-full text-start rounded-xl bg-card shadow-sm border border-border/50 p-3 transition-all duration-200 overflow-hidden',
        'hover:shadow-md hover:border-border',
        isSelected && 'ring-2 ring-primary shadow-md border-primary/50',
        isUnread && 'bg-card/95'
      )}
    >
      {/* Colored stripe indicator */}
      <div 
        className={cn(
          'absolute top-2 bottom-2 right-0 w-1 rounded-l-full transition-colors',
          hasTask ? 'bg-emerald-500' : 'bg-muted-foreground/30'
        )}
      />
      
      {/* Task indicator badge */}
      {hasTask && (
        <div className="absolute top-2 left-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
      )}
      
      <div className="pr-4 min-w-0">
        {/* Header Row - Sender & Date */}
        <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
          <span className={cn(
            'min-w-0 flex-1 line-clamp-1',
            isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/80'
          )}>
            {senderDisplay}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasAttachments && (
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(email.received_at), 'dd/MM', { locale: he })}
              </span>
              <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
                {format(new Date(email.received_at), 'HH:mm', { locale: he })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Subject - Bold */}
        <p className={cn(
          'text-sm mb-1 min-w-0 line-clamp-2 leading-snug',
          isUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground/90'
        )}>
          {subjectDisplay}
        </p>
        
        {/* Body Snippet */}
        <p className="text-xs text-muted-foreground min-w-0 line-clamp-1">
          {bodySnippet || 'אין תוכן'}
        </p>
      </div>
    </button>
  );
}
