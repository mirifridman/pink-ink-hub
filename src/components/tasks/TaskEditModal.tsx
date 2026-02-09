import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees, useProjects } from '@/hooks/useTasks';
import { sendTaskAssignmentNotifications } from '@/hooks/useTaskNotifications';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { format, getDay, getDate, getMonth, isSameMonth, isSameYear, addYears, getYear, startOfMonth, setMonth, setYear } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Trash2, FolderKanban, X, User, Phone, Mail, Repeat, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConvertToProjectModal } from '@/components/projects/ConvertToProjectModal';
import { TaskApprovalSection } from './TaskApprovalSection';
import type { Database } from '@/integrations/supabase/types';

type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];
type TaskPriority = Database['public']['Enums']['task_priority'];
type TaskStatus = Database['public']['Enums']['task_status'];
type ApprovalStatus = Database['public']['Enums']['approval_status'];

export interface EmailToTaskData {
  title: string;
  description: string;
  contactName?: string;
  contactEmail?: string;
  attachmentUrls?: string[];
  sourceReference?: string;
}

interface TaskEditModalProps {
  task: TaskWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  defaultProjectId?: string;
  emailData?: EmailToTaskData;
  onTaskCreated?: () => void;
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'נמוכה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'high', label: 'גבוהה' },
  { value: 'urgent', label: 'דחופה' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'new', label: 'חדשה' },
  { value: 'approved', label: 'מאושרת' },
  { value: 'in_progress', label: 'בביצוע' },
  { value: 'partial', label: 'הושלם חלקית' },
  { value: 'completed', label: 'הושלמה' },
  { value: 'stuck', label: 'תקוע' },
];

// Helper function to get disabled dates based on recurrence type
const getDisabledDates = (
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'yearly' | null,
  baseDate: Date | undefined,
  isEndDate: boolean = false,
  minDate?: Date
) => {
  if (!recurrenceType) return undefined;
  
  if (isEndDate) {
    // For end date, restrict based on start date and recurrence type
    return (date: Date) => {
      // First check if date is before minDate (start date)
      if (minDate) {
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        if (checkDate < min) return true;
      }
      
      // Then check recurrence type restrictions
      if (!baseDate) return false;
      
      switch (recurrenceType) {
        case 'weekly':
          // Only allow dates with the same day of week as start date
          return getDay(date) !== getDay(baseDate);
        case 'monthly':
          // Only allow dates with the same day of month as start date
          return getDate(date) !== getDate(baseDate);
        case 'yearly':
          // Only allow dates with the same day and month as start date
          return getDate(date) !== getDate(baseDate) || getMonth(date) !== getMonth(baseDate);
        case 'daily':
        default:
          // For daily: allow any date after start date
          return false;
      }
    };
  } else {
    // For start date, no restrictions needed
    return undefined;
  }
};

// Helper function to format date based on recurrence type
const formatRecurrenceDate = (
  date: Date | undefined,
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'yearly' | null,
  isEndDate: boolean = false
): string => {
  if (!date) return '';
  
  switch (recurrenceType) {
    case 'daily':
    case 'weekly':
      return format(date, 'd בMMM yyyy', { locale: he });
    case 'monthly':
      return format(date, 'MMM yyyy', { locale: he });
    case 'yearly':
      return date.getFullYear().toString();
    default:
      return format(date, 'd בMMM yyyy', { locale: he });
  }
};

// Helper to create date picker component based on recurrence type
const getDatePickerForRecurrence = (
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'yearly' | null,
  date: Date | undefined,
  onDateChange: (date: Date | undefined) => void,
  disabled?: boolean,
  minDate?: Date,
  isEndDate: boolean = false
) => {
  if (recurrenceType === 'yearly') {
    // Year picker - Select with years
    const minYear = minDate ? getYear(minDate) : undefined;
    return (
      <Select
        value={date ? date.getFullYear().toString() : 'none'}
        onValueChange={(yearStr) => {
          if (yearStr === 'none') {
            onDateChange(undefined);
          } else {
            const year = parseInt(yearStr);
            const newDate = new Date();
            newDate.setFullYear(year, 0, 1);
            
            // Validate against minDate
            if (minDate && newDate < minDate) {
              toast({ 
                title: 'תאריך לא תקין', 
                description: 'תאריך התחלה מאוחר מתאריך סיום. תאריך הסיום אופס.',
                variant: 'destructive' 
              });
              onDateChange(undefined);
              return;
            }
            
            onDateChange(newDate);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="בחר שנה" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">ללא</SelectItem>
          {Array.from({ length: 11 }, (_, i) => {
            const year = new Date().getFullYear() + i;
            const isDisabled = minYear !== undefined && year < minYear;
            return (
              <SelectItem key={year} value={year.toString()} disabled={isDisabled}>
                {year}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  } else if (recurrenceType === 'monthly') {
    // Month-year picker - Select for month and year
    const currentMonth = date ? getMonth(date) : new Date().getMonth();
    const currentYear = date ? getYear(date) : new Date().getFullYear();
    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    
    // Get min month and year from minDate
    const minMonth = minDate ? getMonth(minDate) : undefined;
    const minYear = minDate ? getYear(minDate) : undefined;
    
    return (
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={date ? currentMonth.toString() : 'none'}
          onValueChange={(monthStr) => {
            if (monthStr === 'none') {
              onDateChange(undefined);
            } else {
              const month = parseInt(monthStr);
              const year = date ? getYear(date) : new Date().getFullYear();
              const newDate = new Date();
              newDate.setFullYear(year, month, 1);
              
              // Validate against minDate
              if (minDate && newDate < minDate) {
                toast({ 
                  title: 'תאריך לא תקין', 
                  description: 'תאריך התחלה מאוחר מתאריך סיום. תאריך הסיום אופס.',
                  variant: 'destructive' 
                });
                onDateChange(undefined);
                return;
              }
              
              onDateChange(newDate);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="חודש" />
          </SelectTrigger>
          <SelectContent>
            {monthNames.map((month, index) => {
              // Disable months that are before minDate
              let isDisabled = false;
              if (minDate && minYear !== undefined && minMonth !== undefined) {
                if (currentYear < minYear) {
                  isDisabled = true;
                } else if (currentYear === minYear && index < minMonth) {
                  isDisabled = true;
                }
              }
              return (
                <SelectItem key={index} value={index.toString()} disabled={isDisabled}>
                  {month}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select
          value={date ? currentYear.toString() : 'none'}
          onValueChange={(yearStr) => {
            if (yearStr === 'none') {
              onDateChange(undefined);
            } else {
              const year = parseInt(yearStr);
              const month = date ? getMonth(date) : new Date().getMonth();
              const newDate = new Date();
              newDate.setFullYear(year, month, 1);
              
              // Validate against minDate
              if (minDate && newDate < minDate) {
                toast({ 
                  title: 'תאריך לא תקין', 
                  description: 'תאריך התחלה מאוחר מתאריך סיום. תאריך הסיום אופס.',
                  variant: 'destructive' 
                });
                onDateChange(undefined);
                return;
              }
              
              onDateChange(newDate);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="שנה" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 11 }, (_, i) => {
              const year = new Date().getFullYear() + i;
              const isDisabled = minDate && year < getYear(minDate);
              return (
                <SelectItem key={year} value={year.toString()} disabled={isDisabled}>
                  {year}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  } else {
    // Daily or Weekly - Full date picker
    // Get disabled dates function for recurrence type restrictions
    const recurrenceDisabledDates = getDisabledDates(recurrenceType, minDate, isEndDate, minDate);
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-right font-normal',
              !date && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {date ? format(date, 'd בMMM yyyy', { locale: he }) : 'בחר תאריך'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            locale={he}
            disabled={recurrenceDisabledDates || (disabled ? () => true : undefined)}
          />
        </PopoverContent>
      </Popover>
    );
  }
};

export function TaskEditModal({ task, isOpen, onClose, mode, defaultProjectId, emailData, onTaskCreated }: TaskEditModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: employees } = useEmployees();
  const { data: projects } = useProjects();

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  
  // Track newly created task to show approval buttons
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [createdTaskTitle, setCreatedTaskTitle] = useState<string>('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('new');
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  // Contact fields
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  // Email attachments
  const [emailAttachments, setEmailAttachments] = useState<string[]>([]);
  
  // Source reference for linking to email
  const [sourceReference, setSourceReference] = useState<string | null>(null);
  
  // Recurrence fields
  const [isRecurrenceEnabled, setIsRecurrenceEnabled] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | null>(null);
  const [recurrenceStartDate, setRecurrenceStartDate] = useState<Date | undefined>();
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>();
  const [recurrenceAlertBefore, setRecurrenceAlertBefore] = useState<'none' | 'day' | 'week' | 'two_weeks' | 'month'>('none');

  // Initialize form when task changes
  useEffect(() => {
    if (task && mode === 'edit') {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'new');
      setProjectId(task.project_id || '');
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      
      const assignees = (task.assignees as { id: string }[] | null) || [];
      setSelectedEmployees(assignees.map(a => a.id));
      
      // Contact fields - cast to any since fields may not be in view yet
      const taskAny = task as any;
      setContactName(taskAny.contact_name || '');
      setContactPhone(taskAny.contact_phone || '');
      setContactEmail(taskAny.contact_email || '');
      setEmailAttachments([]);
      
      // Recurrence fields
      const hasRecurrence = !!taskAny.recurrence_type;
      setIsRecurrenceEnabled(hasRecurrence);
      setRecurrenceType(taskAny.recurrence_type || null);
      setRecurrenceStartDate(taskAny.recurrence_start_date ? new Date(taskAny.recurrence_start_date) : undefined);
      setRecurrenceEndDate(taskAny.recurrence_end_date ? new Date(taskAny.recurrence_end_date) : undefined);
      setRecurrenceAlertBefore(taskAny.recurrence_alert_before || 'none');
    } else if (mode === 'create') {
      resetForm();
      if (defaultProjectId) {
        setProjectId(defaultProjectId);
      }
      // Pre-fill from email data
      if (emailData) {
        setTitle(emailData.title || '');
        setDescription(emailData.description || '');
        setContactName(emailData.contactName || '');
        setContactEmail(emailData.contactEmail || '');
        setEmailAttachments(emailData.attachmentUrls || []);
        setSourceReference(emailData.sourceReference || null);
      } else {
        setSourceReference(null);
      }
    }
  }, [task, mode, isOpen, defaultProjectId, emailData]);

  // Validate recurrence dates - if start date is after end date, reset end date
  useEffect(() => {
    if (recurrenceStartDate && recurrenceEndDate && recurrenceStartDate > recurrenceEndDate) {
      setRecurrenceEndDate(undefined);
      toast({ 
        title: 'תאריך לא תקין', 
        description: 'תאריך התחלה מאוחר מתאריך סיום. תאריך הסיום אופס.',
        variant: 'destructive' 
      });
    }
  }, [recurrenceStartDate, recurrenceEndDate]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('new');
    setProjectId('');
    setDueDate(undefined);
    setSelectedEmployees([]);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setEmailAttachments([]);
    setSourceReference(null);
    setCreatedTaskId(null);
    setCreatedTaskTitle('');
    setIsRecurrenceEnabled(false);
    setRecurrenceType(null);
    setRecurrenceStartDate(undefined);
    setRecurrenceEndDate(undefined);
    setRecurrenceAlertBefore('none');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'שגיאה', description: 'נא להזין כותרת למשימה', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'create') {
        // Create new task
        const { data: newTask, error: taskError } = await supabase
          .from('tasks')
          .insert({
            title,
            description,
            priority,
            status,
            project_id: projectId || null,
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
            created_by: user?.id,
            contact_name: contactName || null,
            contact_phone: contactPhone || null,
            contact_email: contactEmail || null,
            source: sourceReference ? 'email' : null,
            source_reference: sourceReference,
            recurrence_type: isRecurrenceEnabled ? (recurrenceType || null) : null,
            recurrence_start_date: isRecurrenceEnabled && recurrenceStartDate ? format(recurrenceStartDate, 'yyyy-MM-dd') : null,
            recurrence_end_date: isRecurrenceEnabled && recurrenceEndDate ? format(recurrenceEndDate, 'yyyy-MM-dd') : null,
            recurrence_alert_before: isRecurrenceEnabled ? recurrenceAlertBefore : null,
          })
          .select()
          .single();

        if (taskError) throw taskError;

        // Add assignees
        if (selectedEmployees.length > 0 && newTask) {
          const assigneesData = selectedEmployees.map(empId => ({
            task_id: newTask.id,
            employee_id: empId,
            assigned_by: user?.id,
          }));

          const { error: assigneesError } = await supabase
            .from('task_assignees')
            .insert(assigneesData);

          if (assigneesError) throw assigneesError;

          // Send push notifications to assigned employees
          sendTaskAssignmentNotifications(newTask.id, title, selectedEmployees);
        }

        // Add documents from email attachments
        if (emailAttachments.length > 0 && newTask) {
          const documentsData = emailAttachments.map((url, index) => ({
            entity_type: 'task',
            entity_id: newTask.id,
            name: url.split('/').pop() || `קובץ ${index + 1}`,
            file_path: url,
            uploaded_by: user?.id,
          }));

          const { error: docsError } = await supabase
            .from('documents')
            .insert(documentsData);

          if (docsError) {
            console.error('Error adding documents:', docsError);
          }
        }

        // Store the created task ID to show approval section
        setCreatedTaskId(newTask.id);
        setCreatedTaskTitle(title);

        toast({ title: 'הצלחה', description: 'המשימה נוצרה בהצלחה. כעת ניתן לבחור פעולת אישור.' });
        
        // Call callback if provided (e.g., to mark email as processed)
        if (onTaskCreated) {
          onTaskCreated();
        }
        
        // Don't close the modal - let user choose approval action
      } else {
        // Update existing task
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            title,
            description,
            priority,
            status,
            project_id: projectId || null,
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            contact_name: contactName || null,
            contact_phone: contactPhone || null,
            contact_email: contactEmail || null,
            recurrence_type: isRecurrenceEnabled ? (recurrenceType || null) : null,
            recurrence_start_date: isRecurrenceEnabled && recurrenceStartDate ? format(recurrenceStartDate, 'yyyy-MM-dd') : null,
            recurrence_end_date: isRecurrenceEnabled && recurrenceEndDate ? format(recurrenceEndDate, 'yyyy-MM-dd') : null,
            recurrence_alert_before: isRecurrenceEnabled ? recurrenceAlertBefore : null,
          })
          .eq('id', task?.id);

        if (updateError) throw updateError;

        // Update assignees - delete existing and insert new
        await supabase
          .from('task_assignees')
          .delete()
          .eq('task_id', task?.id);

        if (selectedEmployees.length > 0) {
          const assigneesData = selectedEmployees.map(empId => ({
            task_id: task?.id as string,
            employee_id: empId,
            assigned_by: user?.id,
          }));

          const { error: assigneesError } = await supabase
            .from('task_assignees')
            .insert(assigneesData);

          if (assigneesError) throw assigneesError;

          // Send push notifications to newly assigned employees
          // Get previous assignees to only notify new ones
          const previousAssignees = ((task?.assignees as { id: string }[] | null) || []).map(a => a.id);
          const newAssignees = selectedEmployees.filter(id => !previousAssignees.includes(id));
          if (newAssignees.length > 0) {
            sendTaskAssignmentNotifications(task?.id as string, title, newAssignees);
          }
        }

        toast({ title: 'הצלחה', description: 'המשימה עודכנה בהצלחה' });
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-count'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects-with-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['attention-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completed-tasks-count'] });
      onClose();
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast({ 
        title: 'שגיאה', 
        description: error.message || 'אירעה שגיאה בשמירת המשימה', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      toast({ title: 'הצלחה', description: 'המשימה נמחקה בהצלחה' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['attention-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completed-tasks-count'] });
      onClose();
    } catch (error: any) {
      toast({ 
        title: 'שגיאה', 
        description: error.message || 'אירעה שגיאה במחיקת המשימה', 
        variant: 'destructive' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'משימה חדשה' : 'עריכת משימה'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">כותרת *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="הזן כותרת למשימה"
            />
          </div>


          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="הזן תיאור למשימה"
              rows={3}
            />
          </div>

          {/* Deadline - prominent and below description */}
          <div className="space-y-2 mt-2">
            <Label className="text-base font-normal flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              דדליין
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-right font-normal text-base h-11 border border-primary',
                    !dueDate && 'text-muted-foreground border-border'
                  )}
                >
                  <CalendarIcon className="ml-2 h-5 w-5" />
                  {dueDate ? format(dueDate, 'd בMMM yyyy', { locale: he }) : 'בחר תאריך'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  locale={he}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Priority, Status, Project - merged to one row under deadline */}
          <div className="flex flex-col mt-2">
            <div className="flex flex-row gap-2 items-center">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">עדיפות</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">סטטוס</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">פרויקט</Label>
                <Select value={projectId || 'none'} onValueChange={(v) => setProjectId(v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="ללא" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא פרויקט</SelectItem>
                    {projects?.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        {proj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Recurrence Section */}
          <Separator />
          <Collapsible open={isRecurrenceEnabled} onOpenChange={setIsRecurrenceEnabled}>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Repeat className="h-4 w-4" />
                חזרתיות
              </Label>
              <Switch
                checked={isRecurrenceEnabled}
                onCheckedChange={setIsRecurrenceEnabled}
              />
            </div>
            <CollapsibleContent className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                {/* Recurrence Type */}
                <div className="space-y-2">
                  <Label htmlFor="recurrenceType" className="text-sm">סוג חזרתיות *</Label>
                  <Select 
                    value={recurrenceType || 'none'} 
                    onValueChange={(v) => setRecurrenceType(v === 'none' ? null : v as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סוג חזרתיות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">יום</SelectItem>
                      <SelectItem value="weekly">שבוע</SelectItem>
                      <SelectItem value="monthly">חודש</SelectItem>
                      <SelectItem value="yearly">שנה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="recurrenceStartDate" className="text-sm">תאריך התחלה (אופציונלי)</Label>
                  {getDatePickerForRecurrence(
                    recurrenceType,
                    recurrenceStartDate,
                    setRecurrenceStartDate,
                    !recurrenceType
                  )}
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate" className="text-sm">תאריך סיום (אופציונלי)</Label>
                  {getDatePickerForRecurrence(
                    recurrenceType,
                    recurrenceEndDate,
                    setRecurrenceEndDate,
                    !recurrenceType || !recurrenceStartDate,
                    recurrenceStartDate,
                    true // isEndDate
                  )}
                </div>

                {/* Alert Before */}
                <div className="space-y-2">
                  <Label htmlFor="recurrenceAlertBefore" className="text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    התראה לפני (אופציונלי)
                  </Label>
                  <Select
                    value={recurrenceAlertBefore}
                    onValueChange={(v) => setRecurrenceAlertBefore(v as 'none' | 'day' | 'week' | 'two_weeks' | 'month')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר התראה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ללא התראה</SelectItem>
                      <SelectItem value="day">יום לפני</SelectItem>
                      <SelectItem value="week">שבוע לפני</SelectItem>
                      <SelectItem value="two_weeks">שבועיים לפני</SelectItem>
                      <SelectItem value="month">חודש לפני</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>אחראים</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[80px] bg-muted/30">
              {employees?.map((emp) => (
                <Badge
                  key={emp.id}
                  variant={selectedEmployees.includes(emp.id) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleEmployee(emp.id)}
                >
                  {emp.full_name}
                  {selectedEmployees.includes(emp.id) && (
                    <X className="h-3 w-3 mr-1" />
                  )}
                </Badge>
              ))}
              {(!employees || employees.length === 0) && (
                <p className="text-sm text-muted-foreground">אין עובדים במערכת</p>
              )}
            </div>
          </div>


          {/* Contact Person section removed as requested */}

          {/* Approval Section - Show for edit mode OR after creating a new task */}
          {(mode === 'edit' && task) ? (
            <TaskApprovalSection
              taskId={task.id!}
              taskTitle={task.title || ''}
              approvalStatus={task.approval_status}
              approvedBy={task.approved_by}
              approvedByName={task.approved_by_name}
              approvedAt={task.approved_at}
              rejectedBy={task.rejected_by}
              rejectedByName={task.rejected_by_name}
              rejectedAt={task.rejected_at}
              rejectionReason={task.rejection_reason}
              onStatusChange={() => {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
              }}
            />
          ) : (mode === 'create' && createdTaskId) ? (
            <TaskApprovalSection
              taskId={createdTaskId}
              taskTitle={createdTaskTitle}
              approvalStatus="pending"
              approvedBy={null}
              approvedByName={null}
              approvedAt={null}
              rejectedBy={null}
              rejectedByName={null}
              rejectedAt={null}
              rejectionReason={null}
              onStatusChange={() => {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                onClose();
              }}
            />
          ) : null}

          {/* Rejection reason display */}
          {task?.approval_status === 'rejected' && task.rejection_reason && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm font-medium text-destructive">סיבת דחייה:</p>
              <p className="text-sm text-muted-foreground">{task.rejection_reason}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {mode === 'edit' && !task?.project_id && (
              <Button variant="outline" onClick={() => setShowConvertModal(true)}>
                <FolderKanban className="h-4 w-4 ml-2" />
                המר לפרויקט
              </Button>
            )}
            {mode === 'edit' && isAdmin && (
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 ml-2" />מחק</>}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {createdTaskId ? 'סגור' : 'ביטול'}
            </Button>
            {!createdTaskId && (
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      {task && (
        <ConvertToProjectModal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          taskId={task.id!}
          taskTitle={task.title || ''}
        />
      )}
    </Dialog>
  );
}
