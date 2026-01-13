import { Bell, Check, Eye, MessageSquare, List, AlertTriangle, Clock, Send } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "react-router-dom";
import { useSystemNotifications, useMarkNotificationRead, type SystemNotification } from "@/hooks/useReminders";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "deadline_2days":
      return <Clock className="w-4 h-4 text-orange-500" />;
    case "deadline_today":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "overdue":
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case "assignment_sent":
      return <Send className="w-4 h-4 text-emerald-500" />;
    case "reminder_sent":
      return <Bell className="w-4 h-4 text-sky-500" />;
    case "team_reminder":
      return <MessageSquare className="w-4 h-4 text-purple-500" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
};

const getNotificationStatus = (type: string): "critical" | "urgent" | "warning" | "success" | "waiting" => {
  switch (type) {
    case "overdue":
    case "deadline_today":
      return "critical";
    case "deadline_2days":
      return "urgent";
    case "assignment_sent":
    case "reminder_sent":
      return "success";
    case "team_reminder":
      return "waiting";
    default:
      return "waiting";
  }
};

export function SystemNotificationsCard() {
  const { data: notifications, isLoading } = useSystemNotifications();
  const markAsRead = useMarkNotificationRead();

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
  const recentNotifications = notifications?.slice(0, 5) || [];

  return (
    <GlassCard className="col-span-full lg:col-span-1 h-full" hover={false}>
      <GlassCardHeader icon={MessageSquare} title="הודעות מערכת" />
      <GlassCardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין הודעות חדשות</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-[14px] transition-all duration-300 cursor-pointer",
                  notification.is_read 
                    ? "bg-muted/20 dark:bg-white/[0.01]" 
                    : "bg-muted/40 dark:bg-white/[0.04] border border-accent/20",
                  "hover:bg-muted/50 dark:hover:bg-white/[0.05]"
                )}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "font-medium text-sm truncate",
                      !notification.is_read && "text-foreground"
                    )}>
                      {notification.title}
                    </span>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { 
                      addSuffix: true, 
                      locale: he 
                    })}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="flex gap-2.5 mt-4">
          <Button 
            variant="outline" 
            className="flex-1 py-3 bg-muted/30 dark:bg-white/[0.05] border-border/50 dark:border-white/[0.08] hover:bg-accent/20 hover:border-accent transition-all duration-300"
            asChild
          >
            <Link to="/messages">
              <Eye className="w-4 h-4 ml-2" />
              כל ההודעות
              {unreadNotifications.length > 0 && (
                <span className="mr-2 px-2 py-0.5 bg-accent text-white text-xs rounded-full">
                  {unreadNotifications.length}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}