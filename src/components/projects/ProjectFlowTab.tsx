import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectStages, useStageTaskAssignments, useProjectTasks } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StageCard } from './StageCard';
import { AddStageModal } from './AddStageModal';
import { AssignTaskModal } from './AssignTaskModal';
import type { Database } from '@/integrations/supabase/types';

type ProjectStage = Database['public']['Tables']['project_stages']['Row'];
type StageStatus = Database['public']['Enums']['stage_status'];

interface ProjectFlowTabProps {
  projectId: string;
}

export function ProjectFlowTab({ projectId }: ProjectFlowTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stages, isLoading } = useProjectStages(projectId);
  const { data: tasks } = useProjectTasks(projectId);
  const stageIds = stages?.map(s => s.id) || [];
  const { data: taskAssignments } = useStageTaskAssignments(stageIds);

  const [orderedStages, setOrderedStages] = useState<ProjectStage[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  const [assignTaskStageId, setAssignTaskStageId] = useState<string | null>(null);

  useEffect(() => {
    if (stages) {
      setOrderedStages(stages);
    }
  }, [stages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedStages.findIndex(s => s.id === active.id);
      const newIndex = orderedStages.findIndex(s => s.id === over.id);

      const newOrder = arrayMove(orderedStages, oldIndex, newIndex);
      setOrderedStages(newOrder);

      // Update order in database
      try {
        for (let i = 0; i < newOrder.length; i++) {
          await supabase
            .from('project_stages')
            .update({ order_index: i })
            .eq('id', newOrder[i].id);
        }
        queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      } catch (error: any) {
        toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleStatusChange = async (stageId: string, newStatus: StageStatus) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user?.id;
      } else {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error } = await supabase
        .from('project_stages')
        .update(updateData)
        .eq('id', stageId);

      if (error) throw error;

      // Recalculate project progress
      await updateProjectProgress();
      
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      toast({ title: 'הסטטוס עודכן בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      const { error } = await supabase
        .from('project_stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;

      await updateProjectProgress();
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      toast({ title: 'השלב נמחק בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    }
  };

  const updateProjectProgress = async () => {
    const { data: allStages } = await supabase
      .from('project_stages')
      .select('status')
      .eq('project_id', projectId);

    if (allStages && allStages.length > 0) {
      const completedCount = allStages.filter(s => s.status === 'completed').length;
      const progress = Math.round((completedCount / allStages.length) * 100);

      await supabase
        .from('projects')
        .update({ progress })
        .eq('id', projectId);

      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects-with-stats'] });
    }
  };

  const getTasksForStage = (stageId: string) => {
    return taskAssignments?.filter(ta => ta.stage_id === stageId).map(ta => ta.task) || [];
  };

  // Calculate progress
  const completedStages = orderedStages.filter(s => s.status === 'completed').length;
  const progress = orderedStages.length > 0 ? Math.round((completedStages / orderedStages.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">שלבי ביצוע</h3>
          <p className="text-sm text-muted-foreground">
            {completedStages}/{orderedStages.length} שלבים הושלמו • {progress}% התקדמות
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          הוסף שלב
        </Button>
      </div>

      {/* Timeline */}
      {orderedStages.length > 0 && (
        <div className="flex items-center justify-center gap-0 py-4 px-8">
          {orderedStages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              {/* Stage Circle */}
              <div className="relative group">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all border-2',
                    stage.status === 'completed'
                      ? 'bg-success border-success text-success-foreground'
                      : stage.status === 'in_progress'
                      ? 'bg-primary/20 border-primary animate-pulse'
                      : 'bg-muted border-border'
                  )}
                >
                  {stage.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {/* Tooltip */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {stage.name}
                </div>
              </div>
              {/* Connector Line */}
              {index < orderedStages.length - 1 && (
                <div
                  className={cn(
                    'h-1 w-12 transition-all',
                    stage.status === 'completed' ? 'bg-green-500' : 'bg-border'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stage Cards with Drag & Drop */}
      {orderedStages.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedStages.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {orderedStages.map((stage, index) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  index={index}
                  tasks={getTasksForStage(stage.id)}
                  onStatusChange={(status) => handleStatusChange(stage.id, status)}
                  onEdit={() => setEditingStage(stage)}
                  onDelete={() => handleDeleteStage(stage.id)}
                  onAssignTask={() => setAssignTaskStageId(stage.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Circle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h4 className="font-medium mb-2">אין שלבים</h4>
          <p className="text-sm text-muted-foreground mb-4">הוסף שלבים כדי לעקוב אחר התקדמות הפרויקט</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף שלב ראשון
          </Button>
        </div>
      )}

      {/* Add/Edit Stage Modal */}
      <AddStageModal
        isOpen={isAddModalOpen || !!editingStage}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingStage(null);
        }}
        projectId={projectId}
        stage={editingStage}
        nextOrderIndex={orderedStages.length}
      />

      {/* Assign Task Modal */}
      <AssignTaskModal
        isOpen={!!assignTaskStageId}
        onClose={() => setAssignTaskStageId(null)}
        stageId={assignTaskStageId}
        projectId={projectId}
        existingTaskIds={taskAssignments?.filter(ta => ta.stage_id === assignTaskStageId).map(ta => (ta.task as any)?.id).filter(Boolean) || []}
      />
    </div>
  );
}
