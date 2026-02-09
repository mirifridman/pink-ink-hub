import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bell, CheckCheck, Check, Filter } from 'lucide-react';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';

type FilterType = 'all' | 'unread' | 'read';

export default function Notifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notification: { id: string; is_read: boolean; link: string | null }) => {
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast({ title: 'הצלחה', description: 'כל ההתראות סומנו כנקראו' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_due':
        return '⏰';
      case 'task_completed':
        return '✅';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'task_due':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'task_completed':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <AppLayout title="התראות">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">התראות</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {unreadCount > 0 ? `${unreadCount} התראות שלא נקראו` : 'אין התראות שלא נקראו'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="unread">לא נקראו</SelectItem>
                <SelectItem value="read">נקראו</SelectItem>
              </SelectContent>
            </Select>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                סמן הכל כנקרא
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'אין התראות שלא נקראו' : filter === 'read' ? 'אין התראות נקראו' : 'אין התראות'}
            description={filter === 'all' ? 'כאשר תהיינה התראות חדשות, הן יופיעו כאן' : 'אין התראות התואמות לסינון הנוכחי'}
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(
                  "transition-all hover:shadow-md cursor-pointer",
                  !notification.is_read && "border-primary/50 bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                              "text-sm font-medium",
                              !notification.is_read && "font-semibold"
                            )}>
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                            <Badge
                              variant="outline"
                              className={cn("text-xs", getNotificationColor(notification.type))}
                            >
                              {notification.type === 'task_assigned' && 'שיוך משימה'}
                              {notification.type === 'task_due' && 'תאריך יעד'}
                              {notification.type === 'task_completed' && 'משימה הושלמה'}
                              {notification.type === 'general' && 'כללי'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: he,
                              })}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                              {format(new Date(notification.created_at), 'd בMMM yyyy, HH:mm', { locale: he })}
                            </span>
                          </div>
                        </div>
                        
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead.mutate(notification.id);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
