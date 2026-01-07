import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TableProperties, 
  Plus, 
  GripVertical,
  FileText,
  Palette,
  CheckCircle2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LineupItem {
  id: string;
  position: number;
  pages: string;
  section: string;
  title: string;
  supplier: string;
  deadline: string;
  daysLeft: number;
  contentStatus: "pending" | "in-progress" | "completed" | "approved";
  designStatus: "pending" | "in-progress" | "completed" | "approved";
  approvals: number;
  maxApprovals: number;
}

const mockLineupItems: LineupItem[] = [
  {
    id: "1",
    position: 1,
    pages: "1-2",
    section: "שער",
    title: "כתבת שער - ראיון עם שי גולדשטיין",
    supplier: "דנה כהן",
    deadline: "07/01/2026",
    daysLeft: 0,
    contentStatus: "in-progress",
    designStatus: "pending",
    approvals: 0,
    maxApprovals: 3,
  },
  {
    id: "2",
    position: 2,
    pages: "3-4",
    section: "תוכן עניינים",
    title: "תוכן עניינים + מכתב העורכת",
    supplier: "צוות מערכת",
    deadline: "10/01/2026",
    daysLeft: 3,
    contentStatus: "completed",
    designStatus: "in-progress",
    approvals: 1,
    maxApprovals: 3,
  },
  {
    id: "3",
    position: 3,
    pages: "5-8",
    section: "מדור ראשי",
    title: "חיות הבר של ישראל",
    supplier: "יוסי לוי",
    deadline: "09/01/2026",
    daysLeft: 2,
    contentStatus: "approved",
    designStatus: "completed",
    approvals: 2,
    maxApprovals: 3,
  },
  {
    id: "4",
    position: 4,
    pages: "9-10",
    section: "בישול",
    title: "מתכונים לחורף",
    supplier: "שרה אבידן",
    deadline: "14/01/2026",
    daysLeft: 7,
    contentStatus: "approved",
    designStatus: "approved",
    approvals: 3,
    maxApprovals: 3,
  },
  {
    id: "5",
    position: 5,
    pages: "11-14",
    section: "יצירה",
    title: "פעילויות לילדים",
    supplier: "מיכל רז",
    deadline: "20/01/2026",
    daysLeft: 13,
    contentStatus: "pending",
    designStatus: "pending",
    approvals: 0,
    maxApprovals: 3,
  },
];

const getDeadlineStatus = (daysLeft: number): "critical" | "urgent" | "warning" | "success" | "waiting" => {
  if (daysLeft <= 0) return "critical";
  if (daysLeft <= 2) return "urgent";
  if (daysLeft <= 7) return "warning";
  return "waiting";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-muted text-muted-foreground";
    case "in-progress":
      return "bg-sky-500/10 text-sky-600 border-sky-500/20";
    case "completed":
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    case "approved":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "ממתין";
    case "in-progress":
      return "בעבודה";
    case "completed":
      return "הושלם";
    case "approved":
      return "מאושר";
    default:
      return status;
  }
};

export default function Lineup() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-rubik font-bold text-foreground flex items-center gap-3">
              <TableProperties className="w-8 h-8 text-accent" />
              ליינאפ
            </h1>
            <p className="text-muted-foreground mt-1">ניהול תוכן הגליון</p>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue="1">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="בחר גליון" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">מגזין לילדים - גליון 42</SelectItem>
                <SelectItem value="2">מגזין טבע - גליון 15</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gradient-neon text-white neon-shadow">
              <Plus className="w-4 h-4 ml-2" />
              פריט חדש
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">מקרא:</span>
          <div className="flex items-center gap-4">
            <StatusBadge status="critical">היום</StatusBadge>
            <StatusBadge status="urgent">יומיים</StatusBadge>
            <StatusBadge status="warning">ממתין</StatusBadge>
            <StatusBadge status="success">מאושר</StatusBadge>
          </div>
        </div>

        {/* Lineup Table */}
        <NeonCard>
          <NeonCardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-right font-medium text-muted-foreground w-12"></th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-16">מיקום</th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-20">עמודים</th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-28">מדור</th>
                  <th className="p-4 text-right font-medium text-muted-foreground">כותרת</th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-32">ספק</th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-28">דדליין</th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-24">תוכן</th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-24">עיצוב</th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-28">אישורים</th>
                </tr>
              </thead>
              <tbody>
                {mockLineupItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer",
                      item.daysLeft <= 0 && "bg-red-500/5",
                      item.daysLeft > 0 && item.daysLeft <= 2 && "bg-orange-500/5"
                    )}
                  >
                    <td className="p-4">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    </td>
                    <td className="p-4 font-medium">{item.position}</td>
                    <td className="p-4 text-muted-foreground">{item.pages}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-md bg-muted text-sm">{item.section}</span>
                    </td>
                    <td className="p-4 font-medium">{item.title}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{item.supplier}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={getDeadlineStatus(item.daysLeft)} pulse={item.daysLeft <= 0}>
                        {item.deadline}
                      </StatusBadge>
                    </td>
                    <td className="p-4">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border", getStatusColor(item.contentStatus))}>
                        <FileText className="w-3 h-3" />
                        {getStatusLabel(item.contentStatus)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border", getStatusColor(item.designStatus))}>
                        <Palette className="w-3 h-3" />
                        {getStatusLabel(item.designStatus)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: item.maxApprovals }).map((_, i) => (
                          <CheckCircle2
                            key={i}
                            className={cn(
                              "w-5 h-5",
                              i < item.approvals ? "text-emerald-500" : "text-muted"
                            )}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NeonCardContent>
        </NeonCard>
      </div>
    </AppLayout>
  );
}
