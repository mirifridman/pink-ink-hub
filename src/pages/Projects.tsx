import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectsWithStats, ProjectFilters } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { Plus, FolderKanban } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];

const tabs: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'planning', label: 'תכנון' },
  { value: 'active', label: 'פעיל' },
  { value: 'on_hold', label: 'מושהה' },
  { value: 'completed', label: 'הושלם' },
];

export default function Projects() {
  const [activeTab, setActiveTab] = useState<ProjectStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [taskProjectId, setTaskProjectId] = useState<string | undefined>();

  const filters: ProjectFilters = {
    status: activeTab !== 'all' ? activeTab : undefined,
  };

  const { data: projects, isLoading } = useProjectsWithStats(filters);

  const handleCreateProject = () => {
    setModalMode('create');
    setSelectedProjectId(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (projectId: string) => {
    setModalMode('edit');
    setSelectedProjectId(projectId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProjectId(null);
  };

  const handleOpenTaskModal = (
    task: { id: string; title: string } | null, 
    mode: 'create' | 'edit',
    projectId?: string
  ) => {
    if (mode === 'create') {
      setSelectedTask(null);
      setTaskProjectId(projectId);
    } else if (task) {
      // Create a minimal task object for editing
      setSelectedTask({
        id: task.id,
        title: task.title,
        description: null,
        priority: 'medium',
        status: 'new',
        approval_status: 'pending',
        project_id: projectId || null,
        due_date: null,
        assignees: null,
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        rejected_by: null,
        rejected_by_name: null,
        rejected_at: null,
        rejection_reason: null,
        created_at: null,
        project_name: null,
      } as TaskWithDetails);
      setTaskProjectId(undefined);
    }
    setTaskModalMode(mode);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setTaskProjectId(undefined);
  };

  // Count projects by status
  const allProjects = useProjectsWithStats().data || [];
  const statusCounts = {
    all: allProjects.length,
    planning: allProjects.filter(p => p.status === 'planning').length,
    active: allProjects.filter(p => p.status === 'active').length,
    on_hold: allProjects.filter(p => p.status === 'on_hold').length,
    completed: allProjects.filter(p => p.status === 'completed').length,
  };

  return (
    <AppLayout 
      title="פרויקטים"
      subtitle={`${statusCounts.all} פרויקטים | ${statusCounts.active} פעילים`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold">ניהול פרויקטים</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              צפה ונהל את כל הפרויקטים שלך
            </p>
          </div>
        </div>
        <Button onClick={handleCreateProject} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 ml-2" />
          פרויקט חדש
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProjectStatus | 'all')} className="mb-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 sm:gap-2 h-auto p-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              {tab.label}
              {statusCounts[tab.value] > 0 && (
                <Badge 
                  variant={activeTab === tab.value ? 'default' : 'secondary'} 
                  className="text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5"
                >
                  {statusCounts[tab.value]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleEditProject(project.id!)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <FolderKanban className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">אין פרויקטים</h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === 'all' 
              ? 'צור את הפרויקט הראשון שלך'
              : `אין פרויקטים בסטטוס "${tabs.find(t => t.value === activeTab)?.label}"`
            }
          </p>
          {activeTab === 'all' && (
            <Button onClick={handleCreateProject}>
              <Plus className="h-4 w-4 ml-2" />
              פרויקט חדש
            </Button>
          )}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        projectId={selectedProjectId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        onOpenTaskModal={handleOpenTaskModal}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        mode={taskModalMode}
        defaultProjectId={taskProjectId}
      />
    </AppLayout>
  );
}
