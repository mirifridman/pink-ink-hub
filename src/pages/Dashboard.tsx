import { AppLayout } from "@/components/layout/AppLayout";
import { UrgentItemsCard } from "@/components/dashboard/UrgentItemsCard";
import { PendingTasksCard } from "@/components/dashboard/PendingTasksCard";
import { ActiveIssuesCard } from "@/components/dashboard/ActiveIssuesCard";
import { RemindersCard } from "@/components/dashboard/RemindersCard";

// Mock data - will be replaced with real data from Supabase
const mockTasks = [
  {
    id: "1",
    title: "כתבת שער - ראיון עם שי גולדשטיין",
    magazine: "מגזין לילדים - גליון 42",
    deadline: "07/01/2026",
    daysLeft: 0,
    status: "critical" as const,
  },
  {
    id: "2",
    title: "איור מרכזי - חיות הבר",
    magazine: "מגזין טבע - גליון 15",
    deadline: "09/01/2026",
    daysLeft: 2,
    status: "urgent" as const,
  },
  {
    id: "3",
    title: "עריכה סופית - מדור בישול",
    magazine: "מגזין לילדים - גליון 42",
    deadline: "14/01/2026",
    daysLeft: 7,
    status: "warning" as const,
  },
  {
    id: "4",
    title: "צילומי אופנה לגיליון הקיץ",
    magazine: "מגזין טבע - גליון 15",
    deadline: "20/01/2026",
    daysLeft: 13,
    status: "waiting" as const,
  },
];

const mockIssues = [
  {
    id: "1",
    name: "מגזין לילדים",
    number: 42,
    progress: 68,
    totalItems: 25,
    completedItems: 17,
  },
  {
    id: "2",
    name: "מגזין טבע",
    number: 15,
    progress: 45,
    totalItems: 20,
    completedItems: 9,
  },
];

const mockReminders = [
  {
    id: "1",
    supplierName: "דנה כהן",
    itemTitle: "כתבת שער - ראיון עם שי גולדשטיין",
    type: "critical" as const,
    contactMethod: "email" as const,
  },
  {
    id: "2",
    supplierName: "יוסי לוי",
    itemTitle: "איור מרכזי - חיות הבר",
    type: "urgent" as const,
    contactMethod: "both" as const,
  },
];

export default function Dashboard() {
  const handleApproveReminder = (id: string) => {
    console.log("Approved reminder:", id);
  };

  const handleDismissReminder = (id: string) => {
    console.log("Dismissed reminder:", id);
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-rubik font-bold text-foreground">שלום! 👋</h1>
          <p className="text-muted-foreground mt-1">הנה סיכום מהיר של מה שקורה היום</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <UrgentItemsCard critical={2} urgent={5} normal={12} />
          <ActiveIssuesCard issues={mockIssues} />
        </div>

        {/* Tasks and Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingTasksCard tasks={mockTasks} />
          <RemindersCard
            reminders={mockReminders}
            onApprove={handleApproveReminder}
            onDismiss={handleDismissReminder}
          />
        </div>
      </div>
    </AppLayout>
  );
}
