import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, CheckSquare, ListTodo, Clock, CheckCircle2, AlertCircle, Loader2, FileCheck, LayoutGrid, List, ChevronDown, Filter, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useTasks, useTasksCount, type TaskFilters, type TaskSort } from '@/hooks/useTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskListView } from '@/components/tasks/TaskListView';
import { SendApprovalRequestModal } from '@/components/tasks/SendApprovalRequestModal';
import { TaskFiltersBar } from '@/components/tasks/TaskFiltersBar';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { TaskApprovalModal } from '@/components/tasks/TaskApprovalModal';
import { SkeletonTaskCard } from '@/components/shared/SkeletonCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { EmailViewModal } from '@/components/emails/EmailViewModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCreateDecision } from '@/hooks/useDecisions';
import { useActiveEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];
type ApprovalStatus = Database['public']['Enums']['approval_status'];
type TaskStatus = Database['public']['Enums']['task_status'];
type ViewMode = 'cards' | 'list';

const tabs = [
  { value: 'all', label: 'הכל', filter: {}, icon: ListTodo },
  { value: 'pending', label: 'ממתין לאישור', filter: { approvalStatus: 'pending' as ApprovalStatus }, icon: Clock },
  { value: 'approved', label: 'מאושרות', filter: { status: 'approved' as TaskStatus }, icon: FileCheck },
  { value: 'in_progress', label: 'בעבודה', filter: { status: 'in_progress' as TaskStatus }, icon: Loader2 },
  { value: 'partial', label: 'הושלם חלקית', filter: { status: 'partial' as TaskStatus }, icon: AlertCircle },
  { value: 'stuck', label: 'תקוע', filter: { status: 'stuck' as TaskStatus }, icon: AlertCircle },
  { value: 'completed', label: 'הושלמו', filter: { status: 'completed' as TaskStatus }, icon: CheckCircle2 },
];

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createDecision = useCreateDecision();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({ field: 'created_at', direction: 'desc' });
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [taskForApproval, setTaskForApproval] = useState<TaskWithDetails | null>(null);

  // Approval request (email) modal
  const [approvalRequestModalOpen, setApprovalRequestModalOpen] = useState(false);
  const [taskForApprovalRequest, setTaskForApprovalRequest] = useState<{ id: string; title: string; description?: string } | null>(null);

  // Email view modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailIdToView, setEmailIdToView] = useState<string | null>(null);

  // Multi-select
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Employees for inline editing
  const { data: employees } = useActiveEmployees();

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('tasks-view-mode');
    return (saved === 'list' || saved === 'cards') ? saved : 'list';
  });

  const handleViewModeChange = (value: string) => {
    if (value === 'cards' || value === 'list') {
      setViewMode(value);
      localStorage.setItem('tasks-view-mode', value);
    }
  };

  // Sync activeTab with URL query param
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabs.some(t => t.value === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    if (tabValue === 'all') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tabValue);
    }
    setSearchParams(searchParams, { replace: true });
  };

  // Get active tab filter
  const currentTab = tabs.find(t => t.value === activeTab);
  const combinedFilters = { ...filters, ...currentTab?.filter };

  const { data: tasks, isLoading } = useTasks(combinedFilters, sort);
  const { data: allTasks } = useTasks({}, { field: 'created_at', direction: 'desc' });
  const { data: stats } = useTasksCount();

  const pendingCount = stats?.pending_approval || 0;
  const totalTasks = tasks?.length || 0;

  // Count tasks by status for tab badges
  const statusCounts = useMemo(() => {
    if (!allTasks) return {};
    const tasksCount = allTasks.length;
    return {
      all: tasksCount,
      pending: allTasks.filter(t => t.approval_status === 'pending').length,
      approved: allTasks.filter(t => t.status === 'approved').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      partial: allTasks.filter(t => t.status === 'partial').length,
      stuck: allTasks.filter(t => t.status === 'stuck').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
    };
  }, [allTasks]);

  const handleCreateTask = () => {
    setSelectedTask(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditTask = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleApproveTask = (task: TaskWithDetails) => {
    setTaskForApproval(task);
    setApprovalModalOpen(true);
  };

  const handleCloseApprovalModal = () => {
    setApprovalModalOpen(false);
    setTaskForApproval(null);
  };

  const handleCloseApprovalRequest = () => {
    setApprovalRequestModalOpen(false);
    setTaskForApprovalRequest(null);
  };

  const handleConvertToDecision = async (data: { title: string; description: string }) => {
    try {
      await createDecision.mutateAsync({
        title: data.title,
        description: data.description,
      });
      navigate('/decisions');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleConvertToProject = async (data: { title: string; description: string }) => {
    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: data.title,
          description: data.description,
          status: 'planning',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['projects-with-stats'] });
      toast.success('הפרויקט נוצר בהצלחה');
      navigate('/projects');
    } catch (error: any) {
      toast.error('שגיאה ביצירת פרויקט', { description: error.message });
    }
  };

  const handleSaveTask = async (taskId: string, updates: {
    title: string;
    description: string;
    priority: Database['public']['Enums']['task_priority'];
    status: Database['public']['Enums']['task_status'];
    assignees: string[];
  }) => {
    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          priority: updates.priority,
          status: updates.status,
          approval_status: updates.status === 'approved' ? 'approved' : undefined,
          approved_at: updates.status === 'approved' ? new Date().toISOString() : undefined,
          approved_by: updates.status === 'approved' ? user?.id : undefined,
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      await supabase.from('task_assignees').delete().eq('task_id', taskId);
      
      if (updates.assignees.length > 0) {
        const assigneeRecords = updates.assignees.map(empId => ({
          task_id: taskId,
          employee_id: empId,
          assigned_by: user?.id,
        }));
        await supabase.from('task_assignees').upsert(assigneeRecords);
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('המשימה עודכנה בהצלחה');
    } catch (error: any) {
      toast.error('שגיאה בעדכון המשימה', { description: error.message });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('המשימה נמחקה');
    } catch (error: any) {
      toast.error('שגיאה במחיקת המשימה', { description: error.message });
    }
  };

  // Inline update handler for table cells
  const handleInlineUpdate = async (taskId: string, updates: Record<string, any>) => {
    try {
      if (updates.assignees) {
        // Handle assignees separately
        await supabase.from('task_assignees').delete().eq('task_id', taskId);
        if (updates.assignees.length > 0) {
          const assigneeRecords = updates.assignees.map((empId: string) => ({
            task_id: taskId,
            employee_id: empId,
            assigned_by: user?.id,
          }));
          await supabase.from('task_assignees').insert(assigneeRecords);
        }
      } else {
        const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast.error('שגיאה בעדכון', { description: error.message });
    }
  };

  // Email click handler
  const handleEmailClick = (sourceReference: string) => {
    setEmailIdToView(sourceReference);
    setEmailModalOpen(true);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    try {
      for (const id of selectedTaskIds) {
        await supabase.from('tasks').delete().eq('id', id);
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTaskIds([]);
      toast.success(`${selectedTaskIds.length} משימות נמחקו`);
    } catch (error: any) {
      toast.error('שגיאה במחיקה', { description: error.message });
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (status: TaskStatus) => {
    if (selectedTaskIds.length === 0) return;
    try {
      const { error } = await supabase.from('tasks').update({ status }).in('id', selectedTaskIds);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTaskIds([]);
      toast.success(`${selectedTaskIds.length} משימות עודכנו`);
    } catch (error: any) {
      toast.error('שגיאה בעדכון', { description: error.message });
    }
  };

  // Bulk priority update
  const handleBulkPriorityUpdate = async (priority: Database['public']['Enums']['task_priority']) => {
    if (selectedTaskIds.length === 0) return;
    try {
      const { error } = await supabase.from('tasks').update({ priority }).in('id', selectedTaskIds);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTaskIds([]);
      toast.success(`${selectedTaskIds.length} משימות עודכנו`);
    } catch (error: any) {
      toast.error('שגיאה בעדכון', { description: error.message });
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', ctrl: true, action: handleCreateTask }
  ]);

  const getTabBadgeCount = (tabValue: string) => {
    return statusCounts[tabValue as keyof typeof statusCounts] || null;
  };

  return (
    <AppLayout title="משימות">
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Stats - Mobile optimized */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">משימות</h1>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <ListTodo className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {totalTasks} משימות
                </span>
                <Separator orientation="vertical" className="h-3 sm:h-4" />
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {pendingCount} ממתינות
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions row - responsive */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <ToggleGroup type="single" value={viewMode} onValueChange={handleViewModeChange} className="bg-muted/50 p-1 rounded-lg">
              <ToggleGroupItem value="cards" aria-label="תצוגת כרטיסים" className="h-8 w-8 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="תצוגת רשימה" className="h-8 w-8 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={handleCreateTask} size="sm" className="gap-1.5 sm:gap-2 shadow-lg shadow-primary/20 sm:size-default">
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">משימה חדשה</span>
              <span className="xs:hidden">חדש</span>
            </Button>
          </div>
        </div>

        {/* Category Tabs - Desktop: visible, Mobile: collapsible dropdown */}
        {/* Desktop Tabs */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hidden sm:block">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const badgeCount = getTabBadgeCount(tab.value);
                const isActive = activeTab === tab.value;
                
                return (
                  <button
                    key={tab.value}
                    onClick={() => handleTabChange(tab.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4",
                      tab.value === 'stuck' && !isActive && "text-destructive",
                      tab.value === 'partial' && !isActive && "text-warning",
                      isActive && "text-primary-foreground"
                    )} />
                    <span>{tab.label}</span>
                    {badgeCount !== null && badgeCount > 0 && (
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "h-5 min-w-5 px-1.5 text-xs font-bold",
                          isActive 
                            ? "bg-primary-foreground/20 text-primary-foreground" 
                            : tab.value === 'stuck'
                              ? "bg-destructive/20 text-destructive"
                              : tab.value === 'partial'
                                ? "bg-warning/20 text-warning"
                                : tab.value === 'completed'
                                  ? "bg-primary/20 text-primary"
                                  : tab.value === 'in_progress'
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                        )}
                      >
                        {badgeCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Collapsible Sections */}
        <div className="sm:hidden space-y-2">
          {/* Mobile Status Dropdown */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-card/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>{currentTab?.label || 'הכל'}</span>
                  {getTabBadgeCount(activeTab) !== null && getTabBadgeCount(activeTab)! > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                      {getTabBadgeCount(activeTab)}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Card className="border-border/50">
                <CardContent className="p-2 space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const badgeCount = getTabBadgeCount(tab.value);
                    const isActive = activeTab === tab.value;
                    
                    return (
                      <button
                        key={tab.value}
                        onClick={() => handleTabChange(tab.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </div>
                        {badgeCount !== null && badgeCount > 0 && (
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "h-5 min-w-5 px-1.5 text-xs",
                              isActive && "bg-primary-foreground/20 text-primary-foreground"
                            )}
                          >
                            {badgeCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Mobile Filters Dropdown */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-card/30">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>סינון מתקדם</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Card className="border-border/50">
                <CardContent className="p-3">
                  <TaskFiltersBar
                    filters={filters}
                    sort={sort}
                    onFiltersChange={setFilters}
                    onSortChange={setSort}
                  />
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Advanced Filters - Desktop, collapsed by default */}
        <Collapsible className="hidden sm:block">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>סינון מתקדם</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-4">
                <TaskFiltersBar
                  filters={filters}
                  sort={sort}
                  onFiltersChange={setFilters}
                  onSortChange={setSort}
                />
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Bulk Actions Bar */}
        {selectedTaskIds.length > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in">
            <span className="text-sm font-medium">{selectedTaskIds.length} נבחרו</span>
            <div className="flex items-center gap-2 flex-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    שנה סטטוס
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('new')}>חדשה</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('approved')}>מאושרת</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('in_progress')}>בביצוע</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('completed')}>הושלמה</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('stuck')}>תקוע</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    שנה עדיפות
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkPriorityUpdate('low')}>נמוכה</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPriorityUpdate('medium')}>בינונית</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPriorityUpdate('high')}>גבוהה</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPriorityUpdate('urgent')}>דחופה</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                מחק
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedTaskIds([])}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 sm:p-4 border rounded-lg bg-card">
                <SkeletonTaskCard />
              </div>
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TaskCard
                    task={task}
                    onClick={() => handleEditTask(task)}
                    onApprove={() => handleApproveTask(task)}
                    showApproveButton={task.approval_status === 'pending'}
                    onConvertToDecision={handleConvertToDecision}
                    onConvertToProject={handleConvertToProject}
                    onDelete={() => task.id && handleDeleteTask(task.id)}
                    onSave={(updates) => task.id ? handleSaveTask(task.id, updates) : Promise.resolve()}
                  />
                </div>
              ))}
            </div>
          ) : (
            <TaskListView
              tasks={tasks}
              onTaskClick={handleEditTask}
              onApprove={handleApproveTask}
              onDelete={handleDeleteTask}
              onEmailClick={handleEmailClick}
              editable
              onInlineUpdate={handleInlineUpdate}
              selectable
              selectedIds={selectedTaskIds}
              onSelectionChange={setSelectedTaskIds}
              employees={employees || []}
            />
          )
        ) : (
          <EmptyState
            icon={CheckSquare}
            title="אין משימות להצגה"
            description={activeTab === 'all' 
              ? 'התחל ביצירת משימה חדשה כדי לנהל את העבודה שלך'
              : 'אין משימות התואמות לסינון הנוכחי'
            }
            actionLabel={activeTab === 'all' ? 'צור משימה חדשה' : undefined}
            onAction={activeTab === 'all' ? handleCreateTask : undefined}
          />
        )}

        {/* Mobile FAB */}
        <Button
          size="lg"
          className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg shadow-primary/30 lg:hidden z-50"
          onClick={handleCreateTask}
          aria-label="משימה חדשה"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Edit/Create Modal */}
      <TaskEditModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
      />

      {/* Approval Modal */}
      <TaskApprovalModal
        isOpen={approvalModalOpen}
        onClose={handleCloseApprovalModal}
        task={taskForApproval}
      />

      {/* Send approval request modal */}
      <SendApprovalRequestModal
        isOpen={approvalRequestModalOpen}
        onClose={handleCloseApprovalRequest}
        task={taskForApprovalRequest}
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
