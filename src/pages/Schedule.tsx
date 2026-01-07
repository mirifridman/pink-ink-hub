import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Send, 
  ChevronRight,
  ChevronLeft,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  month: string;
  magazine: string;
  issueNumber: number;
  status: "planning" | "in-progress" | "completed";
  contentDeadline: string;
  designDeadline: string;
  publishDate: string;
  sentToSuppliers: boolean;
}

const mockSchedule: ScheduleItem[] = [
  {
    id: "1",
    month: "ינואר",
    magazine: "מגזין לילדים",
    issueNumber: 42,
    status: "in-progress",
    contentDeadline: "15/01/2026",
    designDeadline: "25/01/2026",
    publishDate: "15/02/2026",
    sentToSuppliers: true,
  },
  {
    id: "2",
    month: "ינואר",
    magazine: "מגזין טבע",
    issueNumber: 15,
    status: "in-progress",
    contentDeadline: "20/01/2026",
    designDeadline: "10/02/2026",
    publishDate: "01/03/2026",
    sentToSuppliers: true,
  },
  {
    id: "3",
    month: "פברואר",
    magazine: "מגזין לילדים",
    issueNumber: 43,
    status: "planning",
    contentDeadline: "15/02/2026",
    designDeadline: "25/02/2026",
    publishDate: "15/03/2026",
    sentToSuppliers: false,
  },
  {
    id: "4",
    month: "פברואר",
    magazine: "מגזין טבע",
    issueNumber: 16,
    status: "planning",
    contentDeadline: "20/02/2026",
    designDeadline: "10/03/2026",
    publishDate: "01/04/2026",
    sentToSuppliers: false,
  },
  {
    id: "5",
    month: "מרץ",
    magazine: "מגזין לילדים",
    issueNumber: 44,
    status: "planning",
    contentDeadline: "15/03/2026",
    designDeadline: "25/03/2026",
    publishDate: "15/04/2026",
    sentToSuppliers: false,
  },
  {
    id: "6",
    month: "מרץ",
    magazine: "מגזין טבע",
    issueNumber: 17,
    status: "planning",
    contentDeadline: "20/03/2026",
    designDeadline: "10/04/2026",
    publishDate: "01/05/2026",
    sentToSuppliers: false,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "planning":
      return "waiting";
    case "in-progress":
      return "warning";
    case "completed":
      return "success";
    default:
      return "waiting";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "planning":
      return "בתכנון";
    case "in-progress":
      return "בהפקה";
    case "completed":
      return "הושלם";
    default:
      return status;
  }
};

export default function Schedule() {
  const months = ["ינואר", "פברואר", "מרץ"];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-rubik font-bold text-foreground flex items-center gap-3">
              <Calendar className="w-8 h-8 text-accent" />
              לוח רבעוני
            </h1>
            <p className="text-muted-foreground mt-1">תכנון גליונות לרבעון הקרוב</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Select defaultValue="q1-2026">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="q1-2026">רבעון 1 - 2026</SelectItem>
                <SelectItem value="q2-2026">רבעון 2 - 2026</SelectItem>
                <SelectItem value="q3-2026">רבעון 3 - 2026</SelectItem>
                <SelectItem value="q4-2026">רבעון 4 - 2026</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {months.map((month) => (
            <div key={month} className="space-y-4">
              <h2 className="text-xl font-rubik font-bold text-center py-3 bg-muted rounded-xl">
                {month}
              </h2>
              {mockSchedule
                .filter((item) => item.month === month)
                .map((item) => (
                  <NeonCard
                    key={item.id}
                    variant={item.status === "in-progress" ? "glow" : "default"}
                    className="transition-all hover:-translate-y-1"
                  >
                    <NeonCardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-accent" />
                          <h3 className="font-medium">{item.magazine}</h3>
                        </div>
                        <StatusBadge status={getStatusColor(item.status) as any}>
                          {getStatusLabel(item.status)}
                        </StatusBadge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">גליון #{item.issueNumber}</p>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">דדליין תוכן:</span>
                          <span>{item.contentDeadline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">דדליין עיצוב:</span>
                          <span>{item.designDeadline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">תאריך פרסום:</span>
                          <span className="font-medium">{item.publishDate}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        {item.sentToSuppliers ? (
                          <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <Send className="w-4 h-4" />
                            <span>נשלח לספקים</span>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <Send className="w-4 h-4" />
                            שלח לספקים
                          </Button>
                        )}
                      </div>
                    </NeonCardContent>
                  </NeonCard>
                ))}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
