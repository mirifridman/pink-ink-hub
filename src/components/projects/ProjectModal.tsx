import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useTasks';
import { 
  useProjectById, 
  useProjectMembers, 
  useProjectTasks, 
  useProjectDecisions,
  useProjectDocuments 
} from '@/hooks/useProjects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  Trash2, 
  Plus, 
  Users, 
  CheckSquare, 
  FileText, 
  Gavel,
  GitBranch,
  Mail,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SendTasksEmailModal } from './SendTasksEmailModal';
import { ProjectFlowTab } from './ProjectFlowTab';
import { DocumentUploader } from '@/components/shared/DocumentUploader';
import type { Database } from '@/integrations/supabase/types';

type ProjectWithStats = Database['public']['Views']['projects_with_stats']['Row'];
type ProjectStatus = Database['public']['Enums']['project_status'];
type TaskPriority = Database['public']['Enums']['task_priority'];

interface ProjectModalProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  onOpenTaskModal?: (task: { id: string; title: string } | null, mode: 'create' | 'edit', projectId?: string) => void;
}

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'תכנון' },
  { value: 'active', label: 'פעיל' },
  { value: 'on_hold', label: 'מושהה' },
  { value: 'completed', label: 'הושלם' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'נמוכה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'high', label: 'גבוהה' },
  { value: 'urgent', label: 'דחופה' },
];

export function ProjectModal({ projectId, isOpen, onClose, mode, onOpenTaskModal }: ProjectModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: employees } = useEmployees();
  
  const { data: project } = useProjectById(mode === 'edit' ? projectId : null);
  const { data: members } = useProjectMembers(projectId);
  const { data: tasks } = useProjectTasks(projectId);
  const { data: decisions } = useProjectDecisions(projectId);
  const { data: documents } = useProjectDocuments(projectId);

  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTasksForEmail, setSelectedTasksForEmail] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Initialize form
  useEffect(() => {
    if (project && mode === 'edit') {
      setName(project.name || '');
      setDescription(project.description || '');
      setStatus(project.status || 'planning');
      setPriority(project.priority || 'medium');
      setStartDate(project.start_date ? new Date(project.start_date) : undefined);
      setTargetDate(project.target_date ? new Date(project.target_date) : undefined);
    } else if (mode === 'create') {
      resetForm();
    }
  }, [project, mode, isOpen]);

  useEffect(() => {
    if (members) {
      setSelectedMembers(members.map(m => (m.employee as any)?.id).filter(Boolean));
    }
  }, [members]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('planning');
    setPriority('medium');
    setStartDate(undefined);
    setTargetDate(undefined);
    setSelectedMembers([]);
    setActiveTab('details');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'שגיאה', description: 'נא להזין שם לפרויקט', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'create') {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name,
            description,
            status,
            priority,
            start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
            target_date: targetDate ? format(targetDate, 'yyyy-MM-dd') : null,
            created_by: user?.id,
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // Add members
        if (selectedMembers.length > 0 && newProject) {
          const membersData = selectedMembers.map(empId => ({
            project_id: newProject.id,
            employee_id: empId,
            added_by: user?.id,
          }));

          const { error: membersError } = await supabase
            .from('project_members')
            .insert(membersData);

          if (membersError) throw membersError;
        }

        toast({ title: 'הצלחה', description: 'הפרויקט נוצר בהצלחה' });
      } else {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            name,
            description,
            status,
            priority,
            start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
            target_date: targetDate ? format(targetDate, 'yyyy-MM-dd') : null,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', projectId);

        if (updateError) throw updateError;

        // Update members
        await supabase.from('project_members').delete().eq('project_id', projectId);

        if (selectedMembers.length > 0) {
          const membersData = selectedMembers.map(empId => ({
            project_id: projectId as string,
            employee_id: empId,
            added_by: user?.id,
          }));

          const { error: membersError } = await supabase
            .from('project_members')
            .insert(membersData);

          if (membersError) throw membersError;
        }

        toast({ title: 'הצלחה', description: 'הפרויקט עודכן בהצלחה' });
      }

      queryClient.invalidateQueries({ queryKey: ['projects-with-stats'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      onClose();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;

      toast({ title: 'הצלחה', description: 'הפרויקט נמחק בהצלחה' });
      queryClient.invalidateQueries({ queryKey: ['projects-with-stats'] });
      onClose();
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTask = () => {
    if (!projectId) return;
    
    if (onOpenTaskModal) {
      onOpenTaskModal(null, 'create', projectId);
    }
  };

  const handleEditTask = (task: { id: string; title: string }) => {
    if (onOpenTaskModal) {
      onOpenTaskModal(task, 'edit');
    }
  };

  const toggleMember = (empId: string) => {
    setSelectedMembers(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const toggleTaskForEmail = (taskId: string) => {
    setSelectedTasksForEmail(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleOpenEmailModal = () => {
    if (selectedTasksForEmail.length === 0) {
      toast({ title: 'שגיאה', description: 'יש לבחור לפחות משימה אחת', variant: 'destructive' });
      return;
    }
    setShowEmailModal(true);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'פרויקט חדש' : project?.name || 'עריכת פרויקט'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full justify-start gap-1">
              <TabsTrigger value="details" className="flex-1">פרטים</TabsTrigger>
              <TabsTrigger value="tasks" disabled={mode === 'create'} className="flex-1">
                משימות
                {tasks && tasks.length > 0 && (
                  <Badge variant="secondary" className="mr-1 text-xs">{tasks.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="flow" disabled={mode === 'create'} className="flex-1">פלואו</TabsTrigger>
              <TabsTrigger value="decisions" disabled={mode === 'create'} className="flex-1">החלטות</TabsTrigger>
              <TabsTrigger value="files" disabled={mode === 'create'} className="flex-1">קבצים</TabsTrigger>
              <TabsTrigger value="team" disabled={mode === 'create'} className="flex-1">צוות</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">שם הפרויקט *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="הזן שם לפרויקט"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">תיאור</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="תיאור הפרויקט"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>סטטוס</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>עדיפות</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תאריך התחלה</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('w-full justify-start text-right font-normal', !startDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {startDate ? format(startDate, 'd בMMM yyyy', { locale: he }) : 'בחר תאריך'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={he} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>תאריך יעד</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('w-full justify-start text-right font-normal', !targetDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {targetDate ? format(targetDate, 'd בMMM yyyy', { locale: he }) : 'בחר תאריך'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} locale={he} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {mode === 'create' && (
                <div className="space-y-2">
                  <Label>חברי צוות</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[80px] bg-muted/30">
                    {employees?.map((emp) => (
                      <Badge
                        key={emp.id}
                        variant={selectedMembers.includes(emp.id) ? 'default' : 'outline'}
                        className="cursor-pointer transition-all"
                        onClick={() => toggleMember(emp.id)}
                      >
                        {emp.full_name}
                        {selectedMembers.includes(emp.id) && <X className="h-3 w-3 mr-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg">משימות הפרויקט</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleOpenEmailModal}>
                    <Mail className="h-4 w-4 ml-1" />
                    שלח במייל
                  </Button>
                  <Button size="sm" onClick={handleCreateTask}>
                    <Plus className="h-4 w-4 ml-1" />
                    משימה חדשה
                  </Button>
                </div>
              </div>
              
              {tasks && tasks.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tasks.map((task) => (
                    <Card 
                      key={task.id} 
                      className={cn(
                        "border cursor-pointer transition-all",
                        selectedTasksForEmail.includes(task.id!) 
                          ? "border-primary bg-primary/5" 
                          : "border-border/50 hover:border-border"
                      )}
                    >
                      <CardContent className="p-3 flex items-center justify-between" dir="rtl">
                        <div 
                          className="flex items-center gap-3 flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask({ id: task.id!, title: task.title || '' });
                          }}
                        >
                          <CheckSquare className={cn(
                            "h-4 w-4",
                            selectedTasksForEmail.includes(task.id!) ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div>
                            <p className="font-medium text-sm hover:text-primary transition-colors">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.status === 'completed' ? 'הושלמה' : 
                               task.status === 'in_progress' ? 'בביצוע' : 'חדשה'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(task.due_date), 'd/M/yy')}
                            </span>
                          )}
                          <input
                            type="checkbox"
                            checked={selectedTasksForEmail.includes(task.id!)}
                            onChange={() => toggleTaskForEmail(task.id!)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-border"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>אין משימות בפרויקט זה</p>
                </div>
              )}
            </TabsContent>

            {/* Flow Tab */}
            <TabsContent value="flow" className="py-4">
              {projectId && <ProjectFlowTab projectId={projectId} />}
            </TabsContent>

            {/* Decisions Tab */}
            <TabsContent value="decisions" className="space-y-4 py-4">
              {decisions && decisions.length > 0 ? (
                <div className="space-y-2">
                  {decisions.map((decision) => (
                    <Card key={decision.id} className="border-border/50">
                      <CardContent className="p-3" dir="rtl">
                        <p className="font-medium">{decision.title}</p>
                        {decision.description && (
                          <p className="text-sm text-muted-foreground mt-1">{decision.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {decision.decision_date && format(new Date(decision.decision_date), 'd/M/yy')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gavel className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>אין החלטות בפרויקט זה</p>
                </div>
              )}
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="py-4">
              {projectId ? (
                <DocumentUploader entityType="project" entityId={projectId} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>שמור את הפרויקט כדי להעלות קבצים</p>
                </div>
              )}
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>חברי צוות</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[80px] bg-muted/30">
                  {employees?.map((emp) => (
                    <Badge
                      key={emp.id}
                      variant={selectedMembers.includes(emp.id) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all"
                      onClick={() => toggleMember(emp.id)}
                    >
                      {emp.full_name}
                      {selectedMembers.includes(emp.id) && <X className="h-3 w-3 mr-1" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {members && members.length > 0 && (
                <div className="space-y-2">
                  <Label>חברי צוות נוכחיים</Label>
                  <div className="grid gap-2">
                    {members.map((member) => {
                      const emp = member.employee as any;
                      return (
                        <Card key={member.id} className="border-border/50">
                          <CardContent className="p-3 flex items-center gap-3" dir="rtl">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{emp?.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {emp?.position || 'חבר צוות'} • {member.role}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between">
            <div>
              {mode === 'edit' && isAdmin && (
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>ביטול</Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendTasksEmailModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedTasksForEmail([]);
        }}
        taskIds={selectedTasksForEmail}
        projectName={project?.name || ''}
      />
    </>
  );
}
