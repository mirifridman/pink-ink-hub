import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  MessageCircle, 
  Check, 
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  Send,
  History,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { 
  useReminders, 
  useUpdateReminderStatus, 
  useReminderSettings, 
  useUpdateReminderSettings,
  type Reminder
} from "@/hooks/useReminders";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "reminder_urgent":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case "reminder_2days":
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    case "assignment":
      return <Send className="w-5 h-5 text-emerald-500" />;
    default:
      return <Clock className="w-5 h-5 text-sky-500" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "reminder_urgent":
      return "דחוף (היום)";
    case "reminder_2days":
      return "יומיים";
    case "assignment":
      return "הקצאה";
    case "custom":
      return "תזכורת";
    default:
      return type;
  }
};

export default function Reminders() {
  const { toast } = useToast();
  const { data: allReminders, isLoading } = useReminders();
  const { data: settings, isLoading: settingsLoading } = useReminderSettings();
  const updateStatus = useUpdateReminderStatus();
  const updateSettings = useUpdateReminderSettings();

  const pendingReminders = allReminders?.filter(r => r.status === "pending") || [];
  const sentTodayReminders = allReminders?.filter(r => {
    if (r.status !== "sent" || !r.sent_at) return false;
    const sentDate = new Date(r.sent_at);
    const today = new Date();
    return sentDate.toDateString() === today.toDateString();
  }) || [];
  const historyReminders = allReminders?.filter(r => r.status === "sent") || [];

  const openWhatsApp = (phone: string | null | undefined, message: string) => {
    if (!phone) {
      toast({
        title: "אין מספר טלפון",
        description: "לא הוזן מספר טלפון לספק זה",
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const handleSend = async (reminder: Reminder) => {
    try {
      await updateStatus.mutateAsync({ id: reminder.id, status: 'sent' });
      openWhatsApp(reminder.supplier?.phone, reminder.message);
      toast({
        title: "תזכורת נשלחה",
        description: `תזכורת נשלחה ל${reminder.supplier?.name}`,
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את התזכורת",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'cancelled' });
      toast({
        title: "תזכורת בוטלה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לבטל את התזכורת",
        variant: "destructive",
      });
    }
  };

  const handleSettingChange = async (key: string, value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const ReminderCard = ({ reminder, showActions = true }: { reminder: Reminder; showActions?: boolean }) => (
    <NeonCard
      variant={reminder.type === "reminder_urgent" ? "status" : "default"}
      status={reminder.type === "reminder_urgent" ? "critical" : reminder.type === "reminder_2days" ? "urgent" : undefined}
    >
      <NeonCardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {getTypeIcon(reminder.type)}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{reminder.supplier?.name || "ספק לא ידוע"}</h3>
                <StatusBadge status={reminder.type === "reminder_urgent" ? "critical" : reminder.type === "reminder_2days" ? "urgent" : "waiting"}>
                  {getTypeLabel(reminder.type)}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {reminder.lineup_item?.content || "פריט לא ידוע"}
              </p>
              <p className="text-xs text-muted-foreground">
                {reminder.issue?.magazine?.name} - גליון {reminder.issue?.issue_number} ({reminder.issue?.theme})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {reminder.supplier?.phone && (
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
            )}
            {showActions ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => handleCancel(reminder.id)}
                  disabled={updateStatus.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  className="gradient-neon text-white gap-2"
                  onClick={() => handleSend(reminder)}
                  disabled={updateStatus.isPending}
                >
                  <Send className="w-4 h-4" />
                  שלח עכשיו
                </Button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                {reminder.sent_at && format(new Date(reminder.sent_at), "dd/MM/yyyy HH:mm", { locale: he })}
              </span>
            )}
          </div>
        </div>
      </NeonCardContent>
    </NeonCard>
  );

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-rubik font-bold text-foreground flex items-center gap-3">
              <Bell className="w-8 h-8 text-accent" />
              תזכורות
            </h1>
            <p className="text-muted-foreground mt-1">ניהול תזכורות אוטומטיות לספקים</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ממתינות לשליחה ({pendingReminders.length})
            </TabsTrigger>
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              נשלחו היום ({sentTodayReminders.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              היסטוריה ({historyReminders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingReminders.length === 0 ? (
              <NeonCard>
                <NeonCardContent className="py-12 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>אין תזכורות ממתינות</p>
                </NeonCardContent>
              </NeonCard>
            ) : (
              <div className="space-y-4">
                {/* Group by urgency */}
                {pendingReminders.filter(r => r.type === "reminder_urgent").length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      דחוף (היום)
                    </h3>
                    <div className="space-y-3">
                      {pendingReminders.filter(r => r.type === "reminder_urgent").map(reminder => (
                        <ReminderCard key={reminder.id} reminder={reminder} />
                      ))}
                    </div>
                  </div>
                )}
                {pendingReminders.filter(r => r.type === "reminder_2days").length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      יומיים
                    </h3>
                    <div className="space-y-3">
                      {pendingReminders.filter(r => r.type === "reminder_2days").map(reminder => (
                        <ReminderCard key={reminder.id} reminder={reminder} />
                      ))}
                    </div>
                  </div>
                )}
                {pendingReminders.filter(r => !["reminder_urgent", "reminder_2days"].includes(r.type)).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-sky-500" />
                      אחר
                    </h3>
                    <div className="space-y-3">
                      {pendingReminders.filter(r => !["reminder_urgent", "reminder_2days"].includes(r.type)).map(reminder => (
                        <ReminderCard key={reminder.id} reminder={reminder} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="today">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : sentTodayReminders.length === 0 ? (
              <NeonCard>
                <NeonCardContent className="py-12 text-center text-muted-foreground">
                  <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>לא נשלחו תזכורות היום</p>
                </NeonCardContent>
              </NeonCard>
            ) : (
              <div className="space-y-3">
                {sentTodayReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : historyReminders.length === 0 ? (
              <NeonCard>
                <NeonCardContent className="py-12 text-center text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>אין היסטוריית תזכורות</p>
                </NeonCardContent>
              </NeonCard>
            ) : (
              <div className="space-y-3">
                {historyReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Settings Card */}
        <NeonCard variant="glow">
          <NeonCardHeader>
            <NeonCardTitle>הגדרות תזכורות אוטומטיות</NeonCardTitle>
          </NeonCardHeader>
          <NeonCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">תזכורות לספקים (WhatsApp)</h4>
                <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium">2 ימים לפני דדליין</p>
                      <p className="text-sm text-muted-foreground">יצירת תזכורת ממתינה</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings?.supplier_reminder_2days ?? true}
                    onCheckedChange={(checked) => handleSettingChange('supplier_reminder_2days', checked)}
                    disabled={settingsLoading}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium">ביום הדדליין</p>
                      <p className="text-sm text-muted-foreground">יצירת תזכורת דחופה</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings?.supplier_reminder_urgent ?? true}
                    onCheckedChange={(checked) => handleSettingChange('supplier_reminder_urgent', checked)}
                    disabled={settingsLoading}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">התראות לעורכת (מערכת)</h4>
                <div className="flex items-center justify-between p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-sky-500" />
                    <div>
                      <p className="font-medium">2 ימים לפני דדליין</p>
                      <p className="text-sm text-muted-foreground">התראה על כל דדליין קרוב</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings?.editor_reminder_2days ?? true}
                    onCheckedChange={(checked) => handleSettingChange('editor_reminder_2days', checked)}
                    disabled={settingsLoading}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium">תוכן באיחור</p>
                      <p className="text-sm text-muted-foreground">התראה על תוכן שלא הוגש</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings?.editor_reminder_overdue ?? true}
                    onCheckedChange={(checked) => handleSettingChange('editor_reminder_overdue', checked)}
                    disabled={settingsLoading}
                  />
                </div>
              </div>
            </div>
          </NeonCardContent>
        </NeonCard>
      </div>
    </AppLayout>
  );
}
