import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UrgentItemsCard } from "@/components/dashboard/UrgentItemsCard";
import { PendingTasksCard } from "@/components/dashboard/PendingTasksCard";
import { ActiveIssuesCard } from "@/components/dashboard/ActiveIssuesCard";
import { RemindersCard } from "@/components/dashboard/RemindersCard";
import { LiveDateTime } from "@/components/LiveDateTime";
import { useAuth } from "@/hooks/useAuth";
import { 
  useActiveIssues, 
  usePendingTasks, 
  usePendingReminders, 
  useUrgentItemsCounts 
} from "@/hooks/useDashboard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const getTimeBasedGreeting = (): string => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // שבוע טוב: Saturday from 17:00 until Sunday at 12:00
  if ((day === 6 && hour >= 17) || (day === 0 && hour < 12)) {
    return "שבוע טוב";
  }
  
  // Time-based greetings
  if (hour >= 5 && hour < 11) {
    return "בוקר טוב";
  } else if (hour >= 11 && hour < 14) {
    return "צהריים טובים";
  } else if (hour >= 14 && hour < 17) {
    return "אחה״צ טובים";
  } else if (hour >= 17 && hour < 21) {
    return "ערב טוב";
  } else {
    return "לילה טוב";
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());

  // Update greeting every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: activeIssues, isLoading: issuesLoading } = useActiveIssues();
  const { data: pendingTasks, isLoading: tasksLoading } = usePendingTasks();
  const { data: pendingReminders, isLoading: remindersLoading } = usePendingReminders();
  const { data: urgentCounts, isLoading: countsLoading } = useUrgentItemsCounts();

  const approveReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("התזכורת נשלחה בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-reminders"] });
    },
    onError: () => {
      toast.error("שגיאה בשליחת התזכורת");
    },
  });

  const dismissReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminders")
        .update({ status: "dismissed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("התזכורת בוטלה");
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-reminders"] });
    },
    onError: () => {
      toast.error("שגיאה בביטול התזכורת");
    },
  });

  const handleApproveReminder = (id: string) => {
    // Find the reminder and check if it has contact info
    const reminder = pendingReminders?.find(r => r.id === id);
    if (reminder && !reminder.hasContactInfo) {
      toast.error("לא ניתן לשלוח הקצאה, חסרים פרטי קשר");
      return;
    }
    approveReminder.mutate(id);
  };

  const handleDismissReminder = (id: string) => {
    dismissReminder.mutate(id);
  };

  const queryClient = useQueryClient();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "משתמש";

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-rubik font-bold text-foreground">{greeting} {firstName}! 👋</h1>
          <p className="text-muted-foreground mt-1">הנה סיכום מהיר של מה שקורה היום</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <LiveDateTime />
          {countsLoading ? (
            <Skeleton className="h-48 col-span-full lg:col-span-1" />
          ) : (
            <UrgentItemsCard 
              critical={urgentCounts?.critical || 0} 
              urgent={urgentCounts?.urgent || 0} 
              normal={urgentCounts?.normal || 0} 
            />
          )}
          {issuesLoading ? (
            <Skeleton className="h-48 col-span-full lg:col-span-2" />
          ) : (
            <ActiveIssuesCard issues={activeIssues || []} />
          )}
        </div>

        {/* Tasks and Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tasksLoading ? (
            <Skeleton className="h-64 col-span-full lg:col-span-1" />
          ) : (
            <PendingTasksCard tasks={pendingTasks || []} />
          )}
          {remindersLoading ? (
            <Skeleton className="h-64 col-span-full lg:col-span-1" />
          ) : (
            <RemindersCard
              reminders={pendingReminders || []}
              onApprove={handleApproveReminder}
              onDismiss={handleDismissReminder}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
