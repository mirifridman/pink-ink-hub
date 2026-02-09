import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  ListTodo, 
  Archive, 
  Trash2,
  Loader2,
  Wand2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { supabase } from '@/integrations/supabase/client';
import type { Email, EmailStatus } from '@/hooks/useEmails';
import type { Database } from '@/integrations/supabase/types';

type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];

interface LinkedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress?: number;
}

interface EmailAIActionColumnProps {
  email: Email | null;
  onGenerateTask: (email: Email) => void;
  onUpdateStatus: (emailId: string, status: EmailStatus) => void;
  onDelete: (emailId: string) => void;
  isGenerating?: boolean;
  linkedTasks?: LinkedTask[];
  onTaskCreated?: () => void;
  aiCreatedTaskId?: string | null;
  onClearAiCreatedTaskId?: () => void;
}

const priorityConfig = {
  low: { label: 'נמוכה', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'בינונית', className: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
  high: { label: 'גבוהה', className: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' },
  urgent: { label: 'דחופה', className: 'bg-red-500/20 text-red-600 dark:text-red-400' },
};

const statusConfig = {
  new: { label: 'חדשה', className: 'bg-blue-500/20 text-blue-600' },
  approved: { label: 'מאושרת', className: 'bg-cyan-500/20 text-cyan-600' },
  in_progress: { label: 'בביצוע', className: 'bg-yellow-500/20 text-yellow-600' },
  completed: { label: 'הושלמה', className: 'bg-green-500/20 text-green-600' },
  stuck: { label: 'תקוע', className: 'bg-red-500/20 text-red-600' },
};

export function EmailAIActionColumn({ 
  email, 
  onGenerateTask, 
  onUpdateStatus, 
  onDelete,
  isGenerating,
  linkedTasks = [],
  onTaskCreated,
  aiCreatedTaskId,
  onClearAiCreatedTaskId
}: EmailAIActionColumnProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<TaskWithDetails | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);

  // When aiCreatedTaskId is set from parent (after AI creates task), just clear it
  // We no longer auto-open the modal - users can click the task in the linked list
  useEffect(() => {
    if (aiCreatedTaskId) {
      // Just clear it so parent state is reset, don't open modal automatically
      onClearAiCreatedTaskId?.();
    }
  }, [aiCreatedTaskId, onClearAiCreatedTaskId]);

  // Fetch full task details when a linked task is clicked
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!selectedTaskId) {
        setSelectedTaskDetails(null);
        return;
      }

      setIsLoadingTask(true);
      const { data, error } = await supabase
        .from('tasks_with_details')
        .select('*')
        .eq('id', selectedTaskId)
        .maybeSingle();

      if (!error && data) {
        setSelectedTaskDetails(data);
      }
      setIsLoadingTask(false);
    };

    fetchTaskDetails();
  }, [selectedTaskId]);

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-card/50 rounded-xl border border-border/50">
        <Wand2 className="h-12 w-12 text-primary/30 mb-4" />
        <p className="text-muted-foreground">בחר הודעה כדי לראות פעולות AI</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* AI Generate Task - Prominent Button */}
      <Button 
        onClick={() => onGenerateTask(email)}
        disabled={isGenerating}
        size="lg"
        className="w-full h-14 text-lg font-bold gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
      >
        {isGenerating ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Sparkles className="h-6 w-6" />
        )}
        {isGenerating ? 'מייצר משימה...' : 'צור משימה עם AI'}
      </Button>

      {/* Manual Task Creation */}
      <Button 
        variant="outline"
        onClick={() => setShowTaskModal(true)}
        className="w-full gap-2"
      >
        <ListTodo className="h-4 w-4" />
        צור משימה ידנית
      </Button>

      {/* Linked Tasks */}
      <Card className="flex-1 bg-card/50 border-border/50 overflow-hidden flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            משימות מקושרות
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-2">
          {linkedTasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>אין משימות מקושרות להודעה זו</p>
            </div>
          ) : (
            linkedTasks.map((task) => (
              <button 
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="w-full text-start p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2 hover:bg-muted/50 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium line-clamp-2">{task.title}</p>
                  <Badge className={priorityConfig[task.priority as keyof typeof priorityConfig]?.className || ''}>
                    {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={statusConfig[task.status as keyof typeof statusConfig]?.className || ''}>
                    {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                  </Badge>
                  {task.progress !== undefined && (
                    <div className="flex items-center gap-2 flex-1 mr-3">
                      <Progress value={task.progress} className="h-1.5" />
                      <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Quick Actions */}
      <div className="space-y-2">
        {email.status === 'new' && (
          <Button 
            variant="outline" 
            onClick={() => onUpdateStatus(email.id, 'processed')}
            className="w-full gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            סמן כטופל
          </Button>
        )}

        {email.status !== 'archived' && (
          <Button 
            variant="outline" 
            onClick={() => onUpdateStatus(email.id, 'archived')}
            className="w-full gap-2"
          >
            <Archive className="h-4 w-4" />
            העבר לארכיון
          </Button>
        )}

        <Button 
          variant="ghost" 
          onClick={() => onDelete(email.id)}
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
          מחק הודעה
        </Button>
      </div>

      {/* Task Creation Modal */}
      <TaskEditModal
        task={null}
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        mode="create"
        emailData={{
          title: email.subject,
          description: email.body_text || email.body_html?.replace(/<[^>]*>/g, '') || '',
          contactName: email.sender_name,
          contactEmail: email.sender_address || undefined,
          attachmentUrls: email.attachment_urls || [],
          sourceReference: email.id,
        }}
        onTaskCreated={() => {
          onUpdateStatus(email.id, 'processed');
          onTaskCreated?.();
        }}
      />

      {/* Linked Task View/Edit Modal */}
      <TaskEditModal
        task={selectedTaskDetails}
        isOpen={!!selectedTaskId && !isLoadingTask}
        onClose={() => {
          setSelectedTaskId(null);
          setSelectedTaskDetails(null);
          onClearAiCreatedTaskId?.(); // Clear the AI-created task ID in parent
          onTaskCreated?.(); // Refresh linked tasks after potential edit
        }}
        mode="edit"
      />
    </div>
  );
}
