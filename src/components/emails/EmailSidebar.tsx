import { cn } from '@/lib/utils';
import { Inbox, CheckCircle, Archive, Mail, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type EmailCategory = 'inbox' | 'outbox' | 'archived';

interface EmailSidebarProps {
  activeCategory: EmailCategory;
  onCategoryChange: (category: EmailCategory) => void;
  counts: {
    inbox: number;
    outbox: number;
    archived: number;
  };
}

const categories = [
  { id: 'inbox' as EmailCategory, label: 'דואר נכנס', icon: Inbox },
  { id: 'outbox' as EmailCategory, label: 'דואר יוצא', icon: Send },
  { id: 'archived' as EmailCategory, label: 'ארכיון', icon: Archive },
];

export function EmailSidebar({ activeCategory, onCategoryChange, counts }: EmailSidebarProps) {
  return (
    <div className="w-64 border-l border-border bg-card/50 p-4 space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 mb-4">
        <Mail className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">מרכז דואר</h2>
      </div>
      
      {categories.map((category) => {
        const Icon = category.icon;
        const count = counts[category.id];
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{category.label}</span>
            </div>
            {count > 0 && (
              <Badge
                variant={isActive ? 'secondary' : 'default'}
                className={cn(
                  'text-xs min-w-[1.5rem] justify-center',
                  isActive && 'bg-primary-foreground/20 text-primary-foreground'
                )}
              >
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
