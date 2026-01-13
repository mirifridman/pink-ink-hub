import { Send, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLineupItemReminders } from "@/hooks/useReminders";

interface ReminderStatusIconProps {
  lineupItemId: string;
}

export function ReminderStatusIcon({ lineupItemId }: ReminderStatusIconProps) {
  const { data: reminders } = useLineupItemReminders(lineupItemId);
  
  const hasAssignmentSent = reminders?.some(r => r.type === 'assignment' && r.status === 'sent');
  const hasReminderSent = reminders?.some(r => r.type !== 'assignment' && r.status === 'sent');

  if (hasReminderSent) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Bell className="w-4 h-4 text-orange-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>תזכורת נשלחה</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (hasAssignmentSent) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Send className="w-4 h-4 text-emerald-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>הקצאה נשלחה</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Send className="w-4 h-4 text-muted-foreground/40" />
      </TooltipTrigger>
      <TooltipContent>
        <p>לא נשלחה הודעה</p>
      </TooltipContent>
    </Tooltip>
  );
}
