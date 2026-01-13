import { useState } from "react";
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
  Loader2,
  CheckCircle2,
  FileCheck,
  User,
  Phone,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

const getDaysUntilDeadline = (designStartDate: string | undefined) => {
  if (!designStartDate) return 999;
  return differenceInDays(new Date(designStartDate), new Date());
};

export default function Reminders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: allReminders, isLoading } = useReminders();
  const { data: settings, isLoading: settingsLoading } = useReminderSettings();
  const updateStatus = useUpdateReminderStatus();
  const updateSettings = useUpdateReminderSettings();

  // Filter by assignment type and content status
  const assignmentReminders = allReminders?.filter(r => r.type === "assignment" && r.status === "sent") || [];
  const pendingContentReminders = assignmentReminders.filter(r => !r.content_received);
  const receivedContentReminders = assignmentReminders.filter(r => r.content_received);
  
  // Urgent = deadline within 2 days and content not received
  const urgentReminders = pendingContentReminders.filter(r => {
    const daysLeft = getDaysUntilDeadline(r.issue?.design_start_date);
    return daysLeft <= 2;
  });

  // Pending general reminders (not assignments)
  const pendingReminders = allReminders?.filter(r => r.status === "pending") || [];

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

  const confirmContentReceived = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from("reminders")
        .update({
          content_received: true,
          content_received_date: new Date().toISOString(),
        })
        .eq("id", reminderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({
        title: "עודכן בהצלחה! ✅",
        description: "התוכן סומן כהתקבל",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הסטטוס",
        variant: "destructive",
      });
    },
  });

  const sendManualReminder = async (reminder: Reminder) => {
    const daysLeft = getDaysUntilDeadline(reminder.issue?.design_start_date);
    const deadline = reminder.issue?.design_start_date 
      ? format(new Date(reminder.issue.design_start_date), "dd/MM/yyyy", { locale: he })
      : "לא נקבע";
    
    const message = `היי ${reminder.supplier?.name} 👋

אני רואה שעדיין לא שלחת את "${reminder.lineup_item?.content}"

${daysLeft <= 0 ? "הדדליין עבר! 😬" : daysLeft === 1 ? "נשאר לך יום אחד! ⏰" : `נשארו לך ${daysLeft} ימים! 🕐`}

📅 דדליין: ${deadline}

בבקשה אל תאכזב אותנו 🙏`;

    // Update reminder count
    await supabase
      .from("reminders")
      .update({
        reminder_count: (reminder.reminder_count || 0) + 1,
      })
      .eq("id", reminder.id);

    openWhatsApp(reminder.supplier?.phone, message);
    queryClient.invalidateQueries({ queryKey: ["reminders"] });

    toast({
      title: "תזכורת נשלחה",
      description: `תזכורת נשלחה ל${reminder.supplier?.name}`,
    });
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

  // Assignment card with content tracking
  const AssignmentCard = ({ reminder, showContentActions = true }: { reminder: Reminder; showContentActions?: boolean }) => {
    const daysLeft = getDaysUntilDeadline(reminder.issue?.design_start_date);
    const isUrgent = daysLeft <= 2 && !reminder.content_received;
    const isOverdue = daysLeft < 0 && !reminder.content_received;

    return (
      <NeonCard
        variant={isOverdue ? "status" : isUrgent ? "status" : "default"}
        status={isOverdue ? "critical" : isUrgent ? "urgent" : undefined}
      >
        <NeonCardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-lg">{reminder.lineup_item?.content || "פריט לא ידוע"}</h3>
                {reminder.content_received ? (
                  <StatusBadge status="success">
                    <CheckCircle2 className="w-3 h-3 ml-1" />
                    התקבל
                  </StatusBadge>
                ) : isOverdue ? (
                  <StatusBadge status="critical" pulse>באיחור!</StatusBadge>
                ) : isUrgent ? (
                  <StatusBadge status="urgent" pulse>דחוף</StatusBadge>
                ) : (
                  <StatusBadge status="waiting">ממתין לתוכן</StatusBadge>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{reminder.supplier?.name || "ספק לא ידוע"}</span>
                </div>
                {reminder.supplier?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{reminder.supplier.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {reminder.issue?.design_start_date 
                      ? format(new Date(reminder.issue.design_start_date), "dd/MM/yyyy", { locale: he })
                      : "לא נקבע"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span>
                    עמודים {reminder.lineup_item?.page_start === reminder.lineup_item?.page_end 
                      ? reminder.lineup_item?.page_start 
                      : `${reminder.lineup_item?.page_start}-${reminder.lineup_item?.page_end}`}
                  </span>
                </div>
              </div>

              {/* Issue info */}
              <p className="text-xs text-muted-foreground">
                {reminder.issue?.magazine?.name} - גליון {reminder.issue?.issue_number} ({reminder.issue?.theme})
              </p>

              {/* Reminder count */}
              {(reminder.reminder_count || 0) > 0 && (
                <p className="text-xs text-orange-600">
                  ⏰ נשלחו {reminder.reminder_count} תזכורות
                </p>
              )}

              {/* Received date */}
              {reminder.content_received && reminder.content_received_date && (
                <p className="text-xs text-emerald-600">
                  ✅ התקבל ב-{format(new Date(reminder.content_received_date), "dd/MM/yyyy HH:mm", { locale: he })}
                </p>
              )}
            </div>

            {/* Actions */}
            {showContentActions && !reminder.content_received && (
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  className="gradient-neon text-white gap-2"
                  onClick={() => confirmContentReceived.mutate(reminder.id)}
                  disabled={confirmContentReceived.isPending}
                >
                  <Check className="w-4 h-4" />
                  אישור קבלת תוכן
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => sendManualReminder(reminder)}
                >
                  <Send className="w-4 h-4" />
                  שליחת תזכורת
                </Button>
              </div>
            )}
          </div>
        </NeonCardContent>
      </NeonCard>
    );
  };

  // Pending reminder card (for scheduled reminders)
  const PendingReminderCard = ({ reminder }: { reminder: Reminder }) => (
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
              תזכורות והקצאות
            </h1>
            <p className="text-muted-foreground mt-1">ניהול הקצאות לספקים ומעקב אחר קבלת תוכן</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ממתינים לתוכן ({pendingContentReminders.length})
            </TabsTrigger>
            <TabsTrigger value="urgent" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              דחוף ({urgentReminders.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              התקבל תוכן ({receivedContentReminders.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              תזכורות ממתינות ({pendingReminders.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Content Tab */}
          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingContentReminders.length === 0 ? (
              <NeonCard>
                <NeonCardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>אין הקצאות ממתינות לתוכן</p>
                </NeonCardContent>
              </NeonCard>
            ) : (
              <div className="space-y-4">
                {pendingContentReminders.map(reminder => (
                  <AssignmentCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Urgent Tab */}
          <TabsContent value="urgent">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : urgentReminders.length === 0 ? (
              <NeonCard>
                <NeonCardContent className="py-12 text-center text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>אין פריטים דחופים</p>
                  <p className="text-sm mt-1">פריטים עם פחות מיומיים לדדליין יופיעו כאן</p>
                </NeonCardContent>
              </NeonCard>
            ) : (
              <div className="space-y-4">
                {urgentReminders.map(reminder => (
                  <AssignmentCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Received Content Tab */}
          <TabsContent value="received">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : receivedContentReminders.length === 0 ? (
              <NeonCard>
                <NeonCardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>אין תוכן שהתקבל</p>
                </NeonCardContent>
              </NeonCard>
            ) : (
              <div className="space-y-4">
                {receivedContentReminders.map(reminder => (
                  <AssignmentCard key={reminder.id} reminder={reminder} showContentActions={false} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Scheduled Reminders Tab */}
          <TabsContent value="scheduled">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingReminders.length === 0 ? (
              <NeonCard>
                <NeonCardContent className="py-12 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>אין תזכורות ממתינות לשליחה</p>
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
                        <PendingReminderCard key={reminder.id} reminder={reminder} />
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
                        <PendingReminderCard key={reminder.id} reminder={reminder} />
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
                        <PendingReminderCard key={reminder.id} reminder={reminder} />
                      ))}
                    </div>
                  </div>
                )}
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
