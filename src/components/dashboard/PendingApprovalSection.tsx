import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { usePendingApprovalTasks } from '@/hooks/useDashboardStats';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskApprovalModal } from '@/components/tasks/TaskApprovalModal';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { SkeletonTaskCard } from '@/components/shared/SkeletonCard';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Database } from '@/integrations/supabase/types';

type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];

export function PendingApprovalSection() {
  const navigate = useNavigate();
  const { data: pendingTasks, isLoading } = usePendingApprovalTasks();
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithDetails | null>(null);

  const handleTaskClick = (task: TaskWithDetails) => {
    setEditTask(task);
    setEditModalOpen(true);
  };

  const handleApproveClick = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setApprovalModalOpen(true);
  };

  const handleCloseModal = () => {
    setApprovalModalOpen(false);
    setSelectedTask(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditTask(null);
  };

  const displayTasks = pendingTasks?.slice(0, 6) || [];

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-warning" />
            ממתין לאישור
            {pendingTasks && pendingTasks.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {pendingTasks.length} משימות דורשות את תשומת לבך
              </span>
            )}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/tasks?tab=pending')} 
            className="gap-1"
          >
            הצג הכל
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonTaskCard key={i} />
              ))}
            </div>
          ) : !displayTasks || displayTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="אין משימות ממתינות לאישור"
              description="כל המשימות אושרו. עבודה מצוינת!"
            />
          ) : (
            <TaskListView
              tasks={displayTasks}
              onTaskClick={handleTaskClick}
              onApprove={handleApproveClick}
              onDelete={() => {}}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <TaskEditModal
        task={editTask}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        mode="edit"
      />

      {/* Approval Modal */}
      <TaskApprovalModal
        isOpen={approvalModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
      />
    </>
  );
}
