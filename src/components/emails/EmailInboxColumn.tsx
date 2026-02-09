import { useState } from 'react';
import { Search, Filter, X, Inbox, Send as SendIcon, Archive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { EmailInboxCard } from './EmailInboxCard';
import type { Email } from '@/hooks/useEmails';

export type EmailCategory = 'inbox' | 'outbox' | 'archived';
export type EmailFilter = 'all' | 'unread' | 'read' | 'processed' | 'has_task';

interface EmailInboxColumnProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (email: Email) => void;
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: EmailCategory;
  onCategoryChange: (category: EmailCategory) => void;
  counts: {
    inbox: number;
    outbox: number;
    archived: number;
  };
  emailsWithTasks?: Set<string>;
}

const filterLabels: Record<EmailFilter, string> = {
  all: 'הכל',
  unread: 'לא נקראו',
  read: 'נקראו',
  processed: 'טופלו',
  has_task: 'יש משימה',
};

const categoryConfig = {
  inbox: { label: 'דואר נכנס', icon: Inbox },
  outbox: { label: 'דואר יוצא', icon: SendIcon },
  archived: { label: 'ארכיון', icon: Archive },
};

export function EmailInboxColumn({ 
  emails, 
  selectedEmailId, 
  onSelectEmail, 
  isLoading,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  counts,
  emailsWithTasks = new Set()
}: EmailInboxColumnProps) {
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

  return (
    <div className="flex flex-col h-full bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
      {/* Category Tabs */}
      <div className="flex border-b border-border">
        {(Object.keys(categoryConfig) as EmailCategory[]).map((cat) => {
          const config = categoryConfig[cat];
          const Icon = config.icon;
          const count = counts[cat];
          
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{config.label}</span>
              <Badge variant="secondary" className="h-5 min-w-[20px] text-xs">
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="חיפוש..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10 bg-muted/30"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={activeFilters.length > 0 ? "default" : "outline"} 
                size="icon"
                className="shrink-0"
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
                יש משימה
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters */}
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
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || activeFilters.length > 0 ? 'לא נמצאו תוצאות' : 'אין הודעות בקטגוריה זו'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {filteredEmails.map((email) => (
              <EmailInboxCard
                key={email.id}
                email={email}
                isSelected={email.id === selectedEmailId}
                onSelect={onSelectEmail}
                hasLinkedTasks={emailsWithTasks.has(email.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
