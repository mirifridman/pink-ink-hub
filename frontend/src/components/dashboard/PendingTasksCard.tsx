import { ListTodo, Calendar, Plus, List } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  magazine: string;
  deadline: string;
  daysLeft: number;
  status: "critical" | "urgent" | "warning" | "success" | "waiting";
}

interface PendingTasksCardProps {
  tasks: Task[];
}

const priorityClasses = {
  critical: "bg-red-500 shadow-[0_0_10px_theme(colors.red.500/0.5)]",
  urgent: "bg-orange-500 shadow-[0_0_10px_theme(colors.orange.500/0.5)]",
  warning: "bg-amber-500 shadow-[0_0_10px_theme(colors.amber.500/0.5)]",
  success: "bg-emerald-500 shadow-[0_0_10px_theme(colors.emerald.500/0.5)]",
  waiting: "bg-sky-500 shadow-[0_0_10px_theme(colors.sky.500/0.5)]",
};

export function PendingTasksCard({ tasks }: PendingTasksCardProps) {
  return (
    <GlassCard className="col-span-full lg:col-span-1 h-full" hover={false}>
      <GlassCardHeader icon={ListTodo} title="משימות ממתינות" />
      <GlassCardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין משימות ממתינות</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-3.5 bg-muted/30 dark:bg-white/[0.02] border border-border/50 dark:border-white/[0.08] rounded-[14px] transition-all duration-300 cursor-pointer hover:bg-muted/50 dark:hover:bg-white/[0.05] hover:-translate-x-1.5"
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityClasses[task.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{task.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{task.magazine}</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <Calendar className="w-3 h-3" />
                  <span>{task.deadline}</span>
                </div>
                {task.daysLeft <= 0 && (
                  <span className="px-3 py-1 bg-gradient-to-br from-accent to-accent/80 rounded-full text-[11px] font-semibold text-white">
                    היום!
                  </span>
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
            <Link to="/reminders">
              <Plus className="w-4 h-4 ml-2" />
              משימה חדשה
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 py-3 bg-muted/30 dark:bg-white/[0.05] border-border/50 dark:border-white/[0.08] hover:bg-accent/20 hover:border-accent transition-all duration-300"
            asChild
          >
            <Link to="/reminders">
              <List className="w-4 h-4 ml-2" />
              כל המשימות
            </Link>
          </Button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
