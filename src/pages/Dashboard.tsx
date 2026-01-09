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

export default function Dashboard() {
  const { user } = useAuth();

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
          <h1 className="text-3xl font-rubik font-bold text-foreground">שלום {firstName}! 👋</h1>
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
