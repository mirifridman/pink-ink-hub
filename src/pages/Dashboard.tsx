import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UrgentItemsCard } from "@/components/dashboard/UrgentItemsCard";
import { SystemNotificationsCard } from "@/components/dashboard/SystemNotificationsCard";
import { ActiveIssuesCard } from "@/components/dashboard/ActiveIssuesCard";
import { TeamRemindersCard } from "@/components/dashboard/TeamRemindersCard";
import { TimeWidget } from "@/components/dashboard/TimeWidget";
import { useAuth } from "@/hooks/useAuth";
import { 
  useActiveIssues, 
  useUrgentItemsCounts 
} from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sun, Sunrise, Cloud, Sunset, Moon, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface GreetingData {
  text: string;
  Icon: LucideIcon;
  iconColor: string;
}

const getTimeBasedGreeting = (): GreetingData => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // שבוע טוב: Saturday from 17:00 until Sunday at 12:00
  if ((day === 6 && hour >= 17) || (day === 0 && hour < 12)) {
    return { text: "שבוע טוב", Icon: Sparkles, iconColor: "text-purple-400" };
  }
  
  // Time-based greetings
  if (hour >= 5 && hour < 11) {
    return { text: "בוקר טוב", Icon: Sunrise, iconColor: "text-orange-400" };
  } else if (hour >= 11 && hour < 14) {
    return { text: "צהריים טובים", Icon: Sun, iconColor: "text-yellow-400" };
  } else if (hour >= 14 && hour < 17) {
    return { text: "אחה״צ טובים", Icon: Cloud, iconColor: "text-sky-400" };
  } else if (hour >= 17 && hour < 21) {
    return { text: "ערב טוב", Icon: Sunset, iconColor: "text-orange-500" };
  } else {
    return { text: "לילה טוב", Icon: Moon, iconColor: "text-indigo-400" };
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
  const { data: urgentCounts, isLoading: countsLoading } = useUrgentItemsCounts();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "משתמש";

  return (
    <AppLayout>
      {/* Background gradient for dark mode */}
      <div className="fixed inset-0 pointer-events-none dark:bg-[radial-gradient(ellipse_at_20%_20%,hsl(var(--accent)/0.08)_0%,transparent_50%),radial-gradient(ellipse_at_80%_80%,hsl(280_100%_60%/0.05)_0%,transparent_50%)]" />
      
      <div className="space-y-8 animate-fade-in-up relative z-10">
        {/* Header */}
        <header className="flex items-center gap-4">
          <span className="text-[40px] animate-wave">👋</span>
          <div>
            <h1 className="text-3xl font-rubik font-bold flex items-center gap-2">
              <greeting.Icon className={`w-8 h-8 ${greeting.iconColor}`} />
              {greeting.text} {firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">הנה סיכום מהיר של מה שקורה היום</p>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Row 1 */}
          <div className="lg:col-span-3">
            <TimeWidget />
          </div>
          
          {countsLoading ? (
            <Skeleton className="h-48 lg:col-span-3" />
          ) : (
            <div className="lg:col-span-3">
              <UrgentItemsCard 
                critical={urgentCounts?.critical || 0} 
                urgent={urgentCounts?.urgent || 0} 
                normal={urgentCounts?.normal || 0} 
              />
            </div>
          )}
          
          {issuesLoading ? (
            <Skeleton className="h-48 lg:col-span-6" />
          ) : (
            <div className="lg:col-span-6">
              <ActiveIssuesCard issues={activeIssues || []} />
            </div>
          )}

          {/* Row 2 */}
          <div className="lg:col-span-6">
            <SystemNotificationsCard />
          </div>
          
          <div className="lg:col-span-6">
            <TeamRemindersCard />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
