import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Mail, 
  Paperclip, 
  Search, 
  CheckCircle, 
  ArrowLeftRight, 
  Filter, 
  X,
  Sparkles,
  ListTodo,
  Reply,
  MailOpen,
  Archive,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { Email, EmailStatus } from '@/hooks/useEmails';

export type EmailFilter = 'all' | 'unread' | 'read' | 'processed' | 'has_task';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (email: Email) => void;
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onGenerateTask?: (email: Email) => void;
  onCreateTask?: (email: Email) => void;
  onReply?: (email: Email) => void;
  onMarkAsUnread?: (emailId: string) => void;
  onMarkAsRead?: (emailId: string) => void;
  onUpdateStatus?: (emailId: string, status: EmailStatus) => void;
  onDelete?: (emailId: string) => void;
}

const filterLabels: Record<EmailFilter, string> = {
  all: 'הכל',
  unread: 'לא נקראו',
  read: 'נקראו',
  processed: 'טופלו',
  has_task: 'הומרו למשימה',
};

export function EmailList({ 
  emails, 
  selectedEmailId, 
  onSelectEmail, 
  isLoading,
  searchQuery,
  onSearchChange,
  onGenerateTask,
  onCreateTask,
  onReply,
  onMarkAsUnread,
  onMarkAsRead,
  onUpdateStatus,
  onDelete,
}: EmailListProps) {
  const [activeFilters, setActiveFilters] = useState<EmailFilter[]>([]);

  const toggleFilter = (filter: EmailFilter) => {
    if (filter === 'all') {
      setActiveFilters([]);
      return;
    }
    
    setActiveFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter);
      }
      return [...prev, filter];
    });
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  // Apply filters to emails
  const filteredEmails = emails.filter(email => {
    if (activeFilters.length === 0) return true;
    
    return activeFilters.some(filter => {
      switch (filter) {
        case 'unread':
          return !email.is_read;
        case 'read':
          return email.is_read;
        case 'processed':
          return email.status === 'processed';
        case 'has_task':
          return !!email.created_task_id;
        default:
          return true;
      }
    });
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="חיפוש..." 
            className="pr-10"
            disabled
          />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="חיפוש לפי שם, כתובת, נושא..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={activeFilters.length > 0 ? "default" : "outline"} 
                size="icon"
                className="flex-shrink-0"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>סינון לפי</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={activeFilters.length === 0}
                onCheckedChange={() => clearFilters()}
              >
                הכל
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes('unread')}
                onCheckedChange={() => toggleFilter('unread')}
              >
                לא נקראו
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes('read')}
                onCheckedChange={() => toggleFilter('read')}
              >
                נקראו
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes('processed')}
                onCheckedChange={() => toggleFilter('processed')}
              >
                טופלו
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes('has_task')}
                onCheckedChange={() => toggleFilter('has_task')}
              >
                הומרו למשימה
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activeFilters.map(filter => (
              <Badge 
                key={filter} 
                variant="secondary" 
                className="text-xs gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => toggleFilter(filter)}
              >
                {filterLabels[filter]}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 text-xs px-2"
              onClick={clearFilters}
            >
              נקה הכל
            </Button>
          </div>
        )}
      </div>

      {/* Email List */}
      {filteredEmails.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
          <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery || activeFilters.length > 0 ? 'לא נמצאו תוצאות' : 'אין הודעות בקטגוריה זו'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-y-auto flex-1">
          {filteredEmails.map((email) => {
            const isSelected = email.id === selectedEmailId;
            const hasAttachments = email.attachment_urls && email.attachment_urls.length > 0;
            const isUnread = !email.is_read;
            const isProcessed = email.status === 'processed';
            const hasTask = !!email.created_task_id;

            return (
              <ContextMenu key={email.id}>
                <ContextMenuTrigger asChild>
                  <button
                    onClick={() => onSelectEmail(email)}
                    className={cn(
                      'w-full text-right p-4 transition-all duration-200 hover:bg-muted/50',
                      isSelected && 'bg-primary/10 border-r-2 border-primary',
                      isUnread && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "truncate",
                            isUnread ? "font-bold text-foreground" : "font-medium text-foreground/80"
                          )}>
                            {email.sender_name}
                          </span>
                          {hasAttachments && (
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          {isProcessed && (
                            <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          )}
                          {hasTask && (
                            <ArrowLeftRight className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" />
                          )}
                        </div>
                        <p className={cn(
                          "text-sm truncate mb-1",
                          isUnread ? "font-semibold text-foreground" : "font-normal text-foreground/70"
                        )}>
                          {email.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {email.body_text?.substring(0, 100) || 'אין תוכן'}
                        </p>
                      </div>
                      <div className={cn(
                        "text-xs whitespace-nowrap",
                        isUnread ? "font-semibold text-foreground" : "text-muted-foreground"
                      )}>
                        {format(new Date(email.received_at), 'dd MMM', { locale: he })}
                      </div>
                    </div>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56">
                  {onGenerateTask && (
                    <ContextMenuItem onClick={() => onGenerateTask(email)} className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      צור משימה עם AI
                    </ContextMenuItem>
                  )}
                  {onCreateTask && (
                    <ContextMenuItem onClick={() => onCreateTask(email)} className="gap-2">
                      <ListTodo className="h-4 w-4" />
                      צור משימה
                    </ContextMenuItem>
                  )}
                  {onReply && (
                    <ContextMenuItem onClick={() => onReply(email)} className="gap-2">
                      <Reply className="h-4 w-4" />
                      השב
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  {email.is_read && onMarkAsUnread && (
                    <ContextMenuItem onClick={() => onMarkAsUnread(email.id)} className="gap-2">
                      <MailOpen className="h-4 w-4" />
                      סמן כלא נקרא
                    </ContextMenuItem>
                  )}
                  {!email.is_read && onMarkAsRead && (
                    <ContextMenuItem onClick={() => onMarkAsRead(email.id)} className="gap-2">
                      <Mail className="h-4 w-4" />
                      סמן כנקרא
                    </ContextMenuItem>
                  )}
                  {email.status === 'new' && onUpdateStatus && (
                    <ContextMenuItem onClick={() => onUpdateStatus(email.id, 'processed')} className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      סמן כטופל
                    </ContextMenuItem>
                  )}
                  {email.status !== 'archived' && onUpdateStatus && (
                    <ContextMenuItem onClick={() => onUpdateStatus(email.id, 'archived')} className="gap-2">
                      <Archive className="h-4 w-4" />
                      העבר לארכיון
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  {onDelete && (
                    <ContextMenuItem 
                      onClick={() => onDelete(email.id)} 
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      מחק
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
}
