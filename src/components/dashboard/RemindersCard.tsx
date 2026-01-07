import { Bell, Check, X, Mail, MessageCircle } from "lucide-react";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Reminder {
  id: string;
  supplierName: string;
  itemTitle: string;
  type: "critical" | "urgent";
  contactMethod: "email" | "whatsapp" | "both";
}

interface RemindersCardProps {
  reminders: Reminder[];
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function RemindersCard({ reminders, onApprove, onDismiss }: RemindersCardProps) {
  return (
    <NeonCard className="col-span-full lg:col-span-1">
      <NeonCardHeader>
        <NeonCardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          תזכורות ממתינות לאישור
        </NeonCardTitle>
      </NeonCardHeader>
      <NeonCardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין תזכורות ממתינות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.slice(0, 5).map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <StatusBadge status={reminder.type} pulse>
                    {reminder.type === "critical" ? "קריטי" : "דחוף"}
                  </StatusBadge>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{reminder.supplierName}</p>
                    <p className="text-sm text-muted-foreground truncate">{reminder.itemTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-muted-foreground ml-2">
                    {(reminder.contactMethod === "email" || reminder.contactMethod === "both") && (
                      <Mail className="w-4 h-4" />
                    )}
                    {(reminder.contactMethod === "whatsapp" || reminder.contactMethod === "both") && (
                      <MessageCircle className="w-4 h-4" />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => onDismiss(reminder.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-accent hover:bg-accent/90"
                    onClick={() => onApprove(reminder.id)}
                  >
                    <Check className="w-4 h-4 ml-1" />
                    שלח
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </NeonCardContent>
    </NeonCard>
  );
}
