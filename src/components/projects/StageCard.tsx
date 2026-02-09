import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  GripVertical, 
  CheckCircle2, 
  Circle, 
  Play, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Plus,
  CheckSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type ProjectStage = Database['public']['Tables']['project_stages']['Row'];
type StageStatus = Database['public']['Enums']['stage_status'];

interface StageCardProps {
  stage: ProjectStage;
  index: number;
  tasks: any[];
  onStatusChange: (status: StageStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssignTask: () => void;
}

const statusConfig: Record<StageStatus, { label: string; icon: any; className: string }> = {
  pending: { label: 'ממתין', icon: Circle, className: 'text-muted-foreground' },
  in_progress: { label: 'בתהליך', icon: Play, className: 'text-primary' },
  completed: { label: 'הושלם', icon: CheckCircle2, className: 'text-green-500' },
};

export function StageCard({
  stage,
  index,
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onAssignTask,
}: StageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const StatusIcon = statusConfig[stage.status].icon;

  const getNextStatus = (): StageStatus | null => {
    if (stage.status === 'pending') return 'in_progress';
    if (stage.status === 'in_progress') return 'completed';
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'border transition-all',
        isDragging ? 'opacity-50 shadow-lg' : '',
        stage.status === 'completed' 
          ? 'border-green-500/30 bg-green-500/5' 
          : stage.status === 'in_progress'
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/50'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Index Badge */}
              <Badge variant="outline" className="shrink-0">
                {index + 1}
              </Badge>

              {/* Title */}
              <h4 className="font-semibold truncate">{stage.name}</h4>

              {/* Status Badge */}
              <Badge
                variant="outline"
                className={cn('shrink-0', statusConfig[stage.status].className)}
              >
                <StatusIcon className="h-3 w-3 ml-1" />
                {statusConfig[stage.status].label}
              </Badge>
            </div>

            {/* Description */}
            {stage.description && (
              <p className="text-sm text-muted-foreground mb-3">{stage.description}</p>
            )}

            {/* Assigned Tasks */}
            {tasks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tasks.map((task: any) => (
                  <Badge key={task?.id} variant="secondary" className="text-xs">
                    <CheckSquare className="h-3 w-3 ml-1" />
                    {task?.title}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onAssignTask}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  שייך משימה
                </Button>

                {nextStatus && (
                  <Button
                    size="sm"
                    variant={nextStatus === 'completed' ? 'default' : 'outline'}
                    onClick={() => onStatusChange(nextStatus)}
                    className="text-xs"
                  >
                    {nextStatus === 'completed' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 ml-1" />
                        סמן כהושלם
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 ml-1" />
                        התחל
                      </>
                    )}
                  </Button>
                )}

                {stage.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange('in_progress')}
                    className="text-xs"
                  >
                    החזר לבתהליך
                  </Button>
                )}
              </div>

              {/* Completion Info & Menu */}
              <div className="flex items-center gap-2">
                {stage.completed_at && (
                  <span className="text-xs text-muted-foreground">
                    הושלם {format(new Date(stage.completed_at), 'd/M/yy HH:mm', { locale: he })}
                  </span>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 ml-2" />
                      ערוך
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
