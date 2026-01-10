import { Bell, Check, X, Plus, List, User, Calendar } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "react-router-dom";
import { useMyReminders } from "@/hooks/useTeamReminders";
import { formatDistanceToNow, format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { NewTeamReminderDialog } from "./NewTeamReminderDialog";

export function TeamRemindersCard() {
  const { data: reminders, isLoading } = useMyReminders();
  const [showNewDialog, setShowNewDialog] = useState(false);

  const pendingReminders = reminders?.filter(r => r.status === 'pending') || [];

  return (
    <GlassCard className="col-span-full lg:col-span-1 h-full" hover={false}>
      <GlassCardHeader icon={Bell} title="תזכורות אישיות" />
      <GlassCardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingReminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין תזכורות פעילות</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingReminders.slice(0, 5).map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start gap-3 p-3.5 bg-muted/30 dark:bg-white/[0.02] border border-border/50 dark:border-white/[0.08] rounded-[14px] transition-all duration-300 hover:bg-muted/50 dark:hover:bg-white/[0.05]"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {reminder.is_personal ? (
                    <Bell className="w-4 h-4 text-purple-500" />
                  ) : (
                    <User className="w-4 h-4 text-sky-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {reminder.title || "תזכורת"}
                    </span>
                    <StatusBadge 
                      status={new Date(reminder.scheduled_for) <= new Date() ? "critical" : "waiting"} 
                      pulse={new Date(reminder.scheduled_for) <= new Date()}
                    >
                      {new Date(reminder.scheduled_for) <= new Date() ? "עכשיו" : "מתוכנן"}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {reminder.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/70">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(new Date(reminder.scheduled_for), "dd/MM HH:mm", { locale: he })}
                    </span>
                    {reminder.sender_name && !reminder.is_personal && (
                      <>
                        <span>•</span>
                        <span>מאת: {reminder.sender_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="flex gap-2.5 mt-4">
          <Button 
            variant="outline" 
            className="flex-1 py-3 bg-muted/30 dark:bg-white/[0.05] border-border/50 dark:border-white/[0.08] hover:bg-accent/20 hover:border-accent transition-all duration-300"
            onClick={() => setShowNewDialog(true)}
          >
            <Plus className="w-4 h-4 ml-2" />
            תזכורת חדשה
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 py-3 bg-muted/30 dark:bg-white/[0.05] border-border/50 dark:border-white/[0.08] hover:bg-accent/20 hover:border-accent transition-all duration-300"
            asChild
          >
            <Link to="/reminders">
              <List className="w-4 h-4 ml-2" />
              כל התזכורות
            </Link>
          </Button>
        </div>

        <NewTeamReminderDialog 
          open={showNewDialog} 
          onOpenChange={setShowNewDialog} 
        />
      </GlassCardContent>
    </GlassCard>
  );
}