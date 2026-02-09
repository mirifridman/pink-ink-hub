import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  PlayCircle,
  Database,
  AlertCircle,
  ArrowLeft,
  ListChecks,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats, useCompletedTasksCount, useStuckTasksCount, useRecentTasks } from '@/hooks/useDashboardStats';
import { SkeletonStatCard } from '@/components/shared/SkeletonCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchModal } from '@/components/shared/SearchModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskApprovalModal } from '@/components/tasks/TaskApprovalModal';
import { EmailViewModal } from '@/components/emails/EmailViewModal';
import { seedDemoData } from '@/utils/seedDemoData';
import { useToast } from '@/hooks/use-toast';
import type { Database as DBTypes } from '@/integrations/supabase/types';

type TaskWithDetails = DBTypes['public']['Views']['tasks_with_details']['Row'];

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithDetails | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [approvalTask, setApprovalTask] = useState<TaskWithDetails | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailIdToView, setEmailIdToView] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: completedCount, isLoading: completedLoading } = useCompletedTasksCount();
  const { data: stuckCount, isLoading: stuckLoading } = useStuckTasksCount();
  const { data: recentTasks, isLoading: tasksLoading } = useRecentTasks(15);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      await queryClient.invalidateQueries();
      toast({
        title: 'נתוני דמה נוספו בהצלחה!',
        description: 'הדשבורד עודכן עם נתונים חדשים',
      });
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף נתוני דמה',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const isStatCardsLoading = statsLoading || completedLoading || stuckLoading;

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', ctrl: true, action: () => setNewTaskOpen(true), description: 'משימה חדשה' },
    { key: 'k', ctrl: true, action: () => setSearchOpen(true), description: 'חיפוש' },
  ]);

  const handleTaskClick = useCallback((task: TaskWithDetails) => {
    setEditTask(task);
    setEditModalOpen(true);
  }, []);

  const handleApproveTask = useCallback((task: TaskWithDetails) => {
    setApprovalTask(task);
    setApprovalModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    // No-op in dashboard - user can delete from the edit modal
  }, []);

  const handleEmailClick = useCallback((sourceReference: string) => {
    setEmailIdToView(sourceReference);
    setEmailModalOpen(true);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'בוקר טוב';
    if (hour < 17) return 'צהריים טובים';
    return 'ערב טוב';
  };

  const statCards = [
    {
      title: 'ממתינות לאישור',
      value: stats?.pending_approval || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      onClick: () => navigate('/tasks?tab=pending'),
    },
    {
      title: 'בעבודה',
      value: stats?.in_progress || 0,
      icon: PlayCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => navigate('/tasks'),
    },
    {
      title: 'הושלמו',
      value: completedCount || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      onClick: () => navigate('/tasks'),
    },
    {
      title: 'תקוע',
      value: stuckCount || 0,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      onClick: () => navigate('/tasks'),
    },
  ];

  return (
    <AppLayout title="דשבורד" subtitle={`${getGreeting()}, ${profile?.full_name || 'משתמש'}`}>
      <div className="space-y-6">
        {/* Seed Demo Data Button - Show when dashboard is empty */}
        {!statsLoading && !recentTasks?.length && (
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <Database className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">הדשבורד ריק</h3>
              <p className="text-muted-foreground mb-4">
                הוסף נתוני דמה ריאליסטיים כדי לראות את המערכת בפעולה
              </p>
              <Button onClick={handleSeedData} disabled={isSeeding}>
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    מוסיף נתונים...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    הוסף נתוני דמה
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isStatCardsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : (
            statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.title}
                  className="hover-lift border-border/50 cursor-pointer transition-all"
                  onClick={stat.onClick}
                  role="button"
                  tabIndex={0}
                  aria-label={`${stat.title}: ${stat.value}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Recent Tasks Table */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5 text-primary" />
              משימות אחרונות
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="gap-1">
              לכל המשימות
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !recentTasks || recentTasks.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="אין משימות"
                description="צור משימה חדשה כדי להתחיל"
                actionLabel="משימה חדשה"
                onAction={() => setNewTaskOpen(true)}
              />
            ) : (
              <TaskListView
                tasks={recentTasks}
                onTaskClick={handleTaskClick}
                onApprove={handleApproveTask}
                onDelete={handleDeleteTask}
                onEmailClick={handleEmailClick}
              />
            )}
          </CardContent>
        </Card>

        {/* Floating Action Button - Mobile */}
        <Button
          size="lg"
          className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg lg:hidden z-50"
          onClick={() => setNewTaskOpen(true)}
          aria-label="משימה חדשה"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* New Task Modal */}
      <TaskEditModal
        isOpen={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        task={null}
        mode="create"
      />

      {/* Edit Task Modal */}
      <TaskEditModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditTask(null); }}
        task={editTask}
        mode="edit"
      />

      {/* Approval Modal */}
      <TaskApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => { setApprovalModalOpen(false); setApprovalTask(null); }}
        task={approvalTask}
      />

      {/* Email View Modal */}
      <EmailViewModal
        emailId={emailIdToView}
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
      />
    </AppLayout>
  );
}
