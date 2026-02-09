import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectTasks } from '@/hooks/useProjects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckSquare, Link } from 'lucide-react';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: string | null;
  projectId: string;
  existingTaskIds: string[];
}

export function AssignTaskModal({
  isOpen,
  onClose,
  stageId,
  projectId,
  existingTaskIds,
}: AssignTaskModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tasks } = useProjectTasks(projectId);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTaskIds(existingTaskIds);
    }
  }, [isOpen, existingTaskIds]);

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSave = async () => {
    if (!stageId) return;

    setIsLoading(true);

    try {
      // Remove existing assignments for this stage
      await supabase
        .from('task_stage_assignments')
        .delete()
        .eq('stage_id', stageId);

      // Add new assignments
      if (selectedTaskIds.length > 0) {
        const assignments = selectedTaskIds.map((taskId) => ({
          task_id: taskId,
          stage_id: stageId,
        }));

        const { error } = await supabase
          .from('task_stage_assignments')
          .insert(assignments);

        if (error) throw error;
      }

      // Update task stage_id
      for (const taskId of selectedTaskIds) {
        await supabase
          .from('tasks')
          .update({ stage_id: stageId })
          .eq('id', taskId);
      }

      toast({ title: 'המשימות שויכו בהצלחה' });
      queryClient.invalidateQueries({ queryKey: ['stage-task-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      onClose();
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const availableTasks = tasks || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            שיוך משימות לשלב
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableTasks.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {availableTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`border cursor-pointer transition-all ${
                    selectedTaskIds.includes(task.id!)
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-border'
                  }`}
                  onClick={() => toggleTask(task.id!)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <Checkbox
                      checked={selectedTaskIds.includes(task.id!)}
                      onChange={() => toggleTask(task.id!)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {task.status === 'completed'
                            ? 'הושלמה'
                            : task.status === 'in_progress'
                            ? 'בביצוע'
                            : 'חדשה'}
                        </Badge>
                      </div>
                    </div>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>אין משימות בפרויקט זה</p>
              <p className="text-xs mt-1">צור משימה חדשה בטאב המשימות</p>
            </div>
          )}

          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            נבחרו {selectedTaskIds.length} משימות
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
