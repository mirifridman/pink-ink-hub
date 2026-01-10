import { Bell, Check, X, Mail, MessageCircle, AlertTriangle, Plus, List } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

interface Reminder {
  id: string;
  supplierName: string;
  itemTitle: string;
  type: "critical" | "urgent";
  contactMethod: "email" | "whatsapp" | "both" | "none";
  hasContactInfo: boolean;
}

interface RemindersCardProps {
  reminders: Reminder[];
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function RemindersCard({ reminders, onApprove, onDismiss }: RemindersCardProps) {
  return (
    <GlassCard className="col-span-full lg:col-span-1 h-full" hover={false}>
      <GlassCardHeader icon={Bell} title="תזכורות ממתינות לאישור" />
      <GlassCardContent>
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <div className="text-5xl mb-4 opacity-30">🔔</div>
            <div className="text-sm">אין תזכורות ממתינות</div>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.slice(0, 5).map((reminder) => (
              <div
                key={reminder.id}
                className={`flex items-center justify-between p-4 rounded-xl bg-muted/30 dark:bg-white/[0.02] border transition-all duration-300 ${
                  !reminder.hasContactInfo 
                    ? "border-orange-500/50" 
                    : "border-border/50 dark:border-white/[0.08]"
                }`}
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
                    {!reminder.hasContactInfo ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>חסרים פרטי קשר</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <>
                        {(reminder.contactMethod === "email" || reminder.contactMethod === "both") && (
                          <Mail className="w-4 h-4" />
                        )}
                        {(reminder.contactMethod === "whatsapp" || reminder.contactMethod === "both") && (
                          <MessageCircle className="w-4 h-4" />
                        )}
                      </>
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
                    disabled={!reminder.hasContactInfo}
                  >
                    <Check className="w-4 h-4 ml-1" />
                    שלח
                  </Button>
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
            asChild
          >
            <Link to="/reminders">
              <Plus className="w-4 h-4 ml-2" />
              תזכורת חדשה
            </Link>
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
      </GlassCardContent>
    </GlassCard>
  );
}
