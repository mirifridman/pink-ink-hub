import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Mail, 
  MessageCircle, 
  Check, 
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Reminder {
  id: string;
  supplierName: string;
  supplierEmail: string;
  itemTitle: string;
  magazine: string;
  daysLeft: number;
  type: "auto" | "urgent" | "critical";
  contactMethod: "email" | "whatsapp" | "both";
  status: "pending" | "sent" | "approved";
  scheduledDate: string;
}

const mockReminders: Reminder[] = [
  {
    id: "1",
    supplierName: "דנה כהן",
    supplierEmail: "dana@example.com",
    itemTitle: "כתבת שער - ראיון עם שי גולדשטיין",
    magazine: "מגזין לילדים - גליון 42",
    daysLeft: 0,
    type: "critical",
    contactMethod: "email",
    status: "pending",
    scheduledDate: "07/01/2026",
  },
  {
    id: "2",
    supplierName: "יוסי לוי",
    supplierEmail: "yossi@example.com",
    itemTitle: "איור מרכזי - חיות הבר",
    magazine: "מגזין טבע - גליון 15",
    daysLeft: 2,
    type: "urgent",
    contactMethod: "both",
    status: "pending",
    scheduledDate: "09/01/2026",
  },
  {
    id: "3",
    supplierName: "שרה אבידן",
    supplierEmail: "sara@example.com",
    itemTitle: "מתכונים לחורף",
    magazine: "מגזין לילדים - גליון 42",
    daysLeft: 7,
    type: "auto",
    contactMethod: "whatsapp",
    status: "sent",
    scheduledDate: "07/01/2026",
  },
  {
    id: "4",
    supplierName: "מיכל רז",
    supplierEmail: "michal@example.com",
    itemTitle: "פעילויות לילדים",
    magazine: "מגזין לילדים - גליון 42",
    daysLeft: 7,
    type: "auto",
    contactMethod: "email",
    status: "sent",
    scheduledDate: "07/01/2026",
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "critical":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case "urgent":
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    case "auto":
      return <Clock className="w-5 h-5 text-sky-500" />;
    default:
      return null;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "critical":
      return "קריטי (0 ימים)";
    case "urgent":
      return "דחוף (2 ימים)";
    case "auto":
      return "אוטומטי (7 ימים)";
    default:
      return type;
  }
};

export default function Reminders() {
  const pendingReminders = mockReminders.filter((r) => r.status === "pending");
  const sentReminders = mockReminders.filter((r) => r.status === "sent");

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

        {/* Settings Card */}
        <NeonCard variant="glow">
          <NeonCardHeader>
            <NeonCardTitle>הגדרות תזכורות</NeonCardTitle>
          </NeonCardHeader>
          <NeonCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-sky-500" />
                  <div>
                    <p className="font-medium">7 ימים לפני</p>
                    <p className="text-sm text-muted-foreground">שליחה אוטומטית</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium">2 ימים לפני</p>
                    <p className="text-sm text-muted-foreground">דורש אישור</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">ביום הדדליין</p>
                    <p className="text-sm text-muted-foreground">דורש אישור</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </NeonCardContent>
        </NeonCard>

        {/* Pending Reminders */}
        <div>
          <h2 className="text-xl font-rubik font-bold mb-4 flex items-center gap-2">
            <StatusBadge status="urgent" pulse>ממתינים לאישור ({pendingReminders.length})</StatusBadge>
          </h2>
          <div className="space-y-4">
            {pendingReminders.map((reminder) => (
              <NeonCard
                key={reminder.id}
                variant="status"
                status={reminder.type === "critical" ? "critical" : "urgent"}
              >
                <NeonCardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getTypeIcon(reminder.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{reminder.supplierName}</h3>
                          <span className="text-sm text-muted-foreground">• {reminder.supplierEmail}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{reminder.itemTitle}</p>
                        <p className="text-xs text-muted-foreground">{reminder.magazine}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {(reminder.contactMethod === "email" || reminder.contactMethod === "both") && (
                          <Mail className="w-4 h-4" />
                        )}
                        {(reminder.contactMethod === "whatsapp" || reminder.contactMethod === "both") && (
                          <MessageCircle className="w-4 h-4" />
                        )}
                      </div>
                      <StatusBadge status={reminder.type === "critical" ? "critical" : "urgent"}>
                        {getTypeLabel(reminder.type)}
                      </StatusBadge>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="gradient-neon text-white gap-2">
                          <Send className="w-4 h-4" />
                          אשר ושלח
                        </Button>
                      </div>
                    </div>
                  </div>
                </NeonCardContent>
              </NeonCard>
            ))}
          </div>
        </div>

        {/* Sent Reminders */}
        <div>
          <h2 className="text-xl font-rubik font-bold mb-4 flex items-center gap-2">
            <StatusBadge status="success">נשלחו ({sentReminders.length})</StatusBadge>
          </h2>
          <div className="space-y-4">
            {sentReminders.map((reminder) => (
              <NeonCard key={reminder.id} className="opacity-75">
                <NeonCardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{reminder.supplierName}</h3>
                          <span className="text-sm text-muted-foreground">• {reminder.supplierEmail}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{reminder.itemTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {(reminder.contactMethod === "email" || reminder.contactMethod === "both") && (
                          <Mail className="w-4 h-4" />
                        )}
                        {(reminder.contactMethod === "whatsapp" || reminder.contactMethod === "both") && (
                          <MessageCircle className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">נשלח ב-{reminder.scheduledDate}</span>
                    </div>
                  </div>
                </NeonCardContent>
              </NeonCard>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
