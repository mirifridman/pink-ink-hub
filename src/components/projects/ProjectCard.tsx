import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CalendarDays, 
  Users, 
  CheckSquare, 
  FileText,
  FolderKanban 
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type ProjectWithStats = Database['public']['Views']['projects_with_stats']['Row'];
type ProjectStatus = Database['public']['Enums']['project_status'];
type TaskPriority = Database['public']['Enums']['task_priority'];

interface ProjectCardProps {
  project: ProjectWithStats;
  onClick: () => void;
}

const statusConfig: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  planning: { label: 'תכנון', variant: 'secondary' },
  active: { label: 'פעיל', variant: 'default' },
  on_hold: { label: 'מושהה', variant: 'outline' },
  completed: { label: 'הושלם', variant: 'secondary' },
};

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'נמוכה', className: 'bg-green-500/20 text-green-500 border-green-500/30' },
  medium: { label: 'בינונית', className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  high: { label: 'גבוהה', className: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  urgent: { label: 'דחופה', className: 'bg-red-500/20 text-red-500 border-red-500/30' },
};

function getProgressColor(progress: number): string {
  if (progress <= 30) return 'bg-red-500';
  if (progress <= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = project.status || 'planning';
  const priority = project.priority || 'medium';
  const progress = project.progress || 0;
  const tasksCount = project.tasks_count || 0;
  const completedTasksCount = project.completed_tasks_count || 0;
  const membersCount = project.members_count || 0;
  const documentsCount = project.documents_count || 0;

  return (
    <Card 
      className="border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
      onClick={onClick}
      dir="rtl"
    >
      <CardContent className="p-5 text-start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start gap-1">
              <Badge variant={statusConfig[status].variant}>
                {statusConfig[status].label}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', priorityConfig[priority].className)}>
                {priorityConfig[priority].label}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">התקדמות</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-2" />
              <div 
                className={cn('absolute top-0 right-0 h-2 rounded-full transition-all', getProgressColor(progress))}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              <span>{completedTasksCount}/{tasksCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{membersCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{documentsCount}</span>
            </div>
          </div>

          {/* Dates */}
          {(project.start_date || project.target_date) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {project.start_date && (
                <span>{format(new Date(project.start_date), 'd בMMM', { locale: he })}</span>
              )}
              {project.start_date && project.target_date && <span>←</span>}
              {project.target_date && (
                <span>{format(new Date(project.target_date), 'd בMMM yyyy', { locale: he })}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
