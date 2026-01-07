import { ListTodo, Calendar } from "lucide-react";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

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

export function PendingTasksCard({ tasks }: PendingTasksCardProps) {
  return (
    <NeonCard className="col-span-full lg:col-span-1">
      <NeonCardHeader>
        <NeonCardTitle className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-accent" />
          משימות ממתינות
        </NeonCardTitle>
      </NeonCardHeader>
      <NeonCardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין משימות ממתינות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <StatusBadge status={task.status} pulse={task.daysLeft <= 0}>
                    {task.daysLeft <= 0 ? "היום!" : task.daysLeft === 1 ? "מחר" : `${task.daysLeft} ימים`}
                  </StatusBadge>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{task.magazine}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                  <Calendar className="w-4 h-4" />
                  <span>{task.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </NeonCardContent>
    </NeonCard>
  );
}
