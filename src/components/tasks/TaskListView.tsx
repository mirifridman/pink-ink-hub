import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CheckCircle2, Clock, AlertCircle, User, Mail, MoreHorizontal, Sparkles, Calendar, Repeat, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];
type TaskPriority = Database['public']['Enums']['task_priority'];
type TaskStatus = Database['public']['Enums']['task_status'];

interface TaskListViewProps {
  tasks: TaskWithDetails[];
  onTaskClick: (task: TaskWithDetails) => void;
  onApprove: (task: TaskWithDetails) => void;
  onDelete: (taskId: string) => void;
  onEmailClick?: (sourceReference: string) => void;
  editable?: boolean;
  onInlineUpdate?: (taskId: string, updates: Record<string, any>) => Promise<void>;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  employees?: { id: string; full_name: string }[];
}

const priorityConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  critical: { label: 'קריטי', className: 'bg-destructive/10 text-destructive border-destructive/30', dotColor: 'bg-destructive' },
  high: { label: 'גבוהה', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30', dotColor: 'bg-orange-500' },
  medium: { label: 'בינונית', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30', dotColor: 'bg-yellow-500' },
  low: { label: 'נמוכה', className: 'bg-muted text-muted-foreground border-border', dotColor: 'bg-muted-foreground' },
};

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'נמוכה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'high', label: 'גבוהה' },
  { value: 'urgent', label: 'דחופה' },
];

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: 'ממתין', icon: Clock, className: 'text-muted-foreground' },
  new: { label: 'חדשה', icon: Clock, className: 'text-muted-foreground' },
  approved: { label: 'מאושר', icon: CheckCircle2, className: 'text-primary' },
  in_progress: { label: 'בעבודה', icon: Clock, className: 'text-blue-500' },
  partial: { label: 'חלקי', icon: AlertCircle, className: 'text-warning' },
  stuck: { label: 'תקוע', icon: AlertCircle, className: 'text-destructive' },
  completed: { label: 'הושלם', icon: CheckCircle2, className: 'text-primary' },
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'new', label: 'חדשה' },
  { value: 'approved', label: 'מאושרת' },
  { value: 'in_progress', label: 'בביצוע' },
  { value: 'partial', label: 'הושלם חלקית' },
  { value: 'completed', label: 'הושלמה' },
  { value: 'stuck', label: 'תקוע' },
];

export function TaskListView({
  tasks,
  onTaskClick,
  onApprove,
  onDelete,
  onEmailClick,
  editable = false,
  onInlineUpdate,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  employees = [],
}: TaskListViewProps) {
  const allSelected = tasks.length > 0 && tasks.every(t => t.id && selectedIds.includes(t.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tasks.map(t => t.id!).filter(Boolean));
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleInlineUpdate = async (taskId: string, field: string, value: any) => {
    if (!onInlineUpdate) return;
    await onInlineUpdate(taskId, { [field]: value });
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="border rounded-lg overflow-hidden bg-card hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) (el as any).indeterminate = someSelected;
                    }}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
              )}
              <TableHead className={selectable ? "w-[30%]" : "w-[35%]"}>כותרת</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>עדיפות</TableHead>
              <TableHead>אחראי</TableHead>
              <TableHead>מקור</TableHead>
              <TableHead>תאריך</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const priority = priorityConfig[task.priority || 'medium'];
              const status = statusConfig[task.status || 'pending'];
              const StatusIcon = status?.icon || Clock;
              const isFromEmail = (task.source === 'email' || task.source === 'n8n') && task.source_reference;
              const isAICreated = (task.source === 'email' || task.source === 'n8n') && !task.created_by;
              const isManual = !isFromEmail && !(task as any).recurrence_type;
              const isSelected = task.id ? selectedIds.includes(task.id) : false;

              return (
                <TableRow
                  key={task.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => onTaskClick(task)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => task.id && toggleOne(task.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {task.source === 'email' && (
                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="font-medium line-clamp-1">{task.title}</span>
                    </div>
                  </TableCell>

                  {/* Status Cell - Inline editable */}
                  <TableCell onClick={(e) => { if (editable) e.stopPropagation(); }}>
                    {editable && onInlineUpdate ? (
                      <Select
                        value={task.status || 'new'}
                        onValueChange={(val) => task.id && handleInlineUpdate(task.id, 'status', val)}
                      >
                        <SelectTrigger className="h-8 w-[120px] border-transparent hover:border-border bg-transparent">
                          <div className={cn("flex items-center gap-1.5", status?.className)}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span className="text-sm">{status?.label}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className={cn("flex items-center gap-1.5", status?.className)}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm">{status?.label}</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Priority Cell - Inline editable */}
                  <TableCell onClick={(e) => { if (editable) e.stopPropagation(); }}>
                    {editable && onInlineUpdate ? (
                      <Select
                        value={task.priority || 'medium'}
                        onValueChange={(val) => task.id && handleInlineUpdate(task.id, 'priority', val)}
                      >
                        <SelectTrigger className="h-8 w-[100px] border-transparent hover:border-border bg-transparent p-0">
                          <Badge variant="outline" className={cn("text-xs", priority?.className)}>
                            {priority?.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={cn("text-xs", priority?.className)}>
                        {priority?.label}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Assignee Cell - Inline editable */}
                  <TableCell onClick={(e) => { if (editable) e.stopPropagation(); }}>
                    {editable && onInlineUpdate && employees.length > 0 ? (
                      <AssigneePopover
                        task={task}
                        employees={employees}
                        onUpdate={(assigneeIds) => task.id && handleInlineUpdate(task.id, 'assignees', assigneeIds)}
                      />
                    ) : (
                      task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">
                            {(task.assignees as any[]).map((a: any) => a.full_name || a.employee_name).filter(Boolean).join(', ') || '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )
                    )}
                  </TableCell>

                  {/* Source Cell */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isFromEmail && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/20 transition-colors"
                          onClick={() => onEmailClick?.(task.source_reference!)}
                        >
                          <Mail className="h-3 w-3 ml-1" />
                          מייל
                        </Badge>
                      )}
                      {isAICreated && (
                        <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30">
                          <Sparkles className="h-3 w-3 ml-1" />
                          AI
                        </Badge>
                      )}
                      {(task as any).recurrence_type && (
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                          <Repeat className="h-3 w-3 ml-1" />
                          {({ daily: 'יומי', weekly: 'שבועי', monthly: 'חודשי', yearly: 'שנתי' } as Record<string, string>)[(task as any).recurrence_type] || (task as any).recurrence_type}
                        </Badge>
                      )}
                      {isManual && (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          <Pencil className="h-3 w-3 ml-1" />
                          ידני
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      {task.due_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(task.due_date), 'd בMMM', { locale: he })}</span>
                        </div>
                      ) : (
                        <span>{task.created_at && format(new Date(task.created_at), 'd בMMM', { locale: he })}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}>
                          עריכה
                        </DropdownMenuItem>
                        {task.approval_status === 'pending' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onApprove(task);
                          }}>
                            אישור
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (task.id) onDelete(task.id);
                          }}
                        >
                          מחיקה
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-2">
        {tasks.map((task) => {
          const priority = priorityConfig[task.priority || 'medium'];
          const status = statusConfig[task.status || 'pending'];
          const StatusIcon = status?.icon || Clock;
          const assigneeNames = task.assignees && Array.isArray(task.assignees)
            ? (task.assignees as any[]).map((a: any) => a.full_name || a.employee_name).filter(Boolean).join(', ')
            : null;
          const isFromEmail = (task.source === 'email' || task.source === 'n8n') && task.source_reference;
          const isAICreated = (task.source === 'email' || task.source === 'n8n') && !task.created_by;
          const isManual = !isFromEmail && !(task as any).recurrence_type;
          const isSelected = task.id ? selectedIds.includes(task.id) : false;

          return (
            <Card
              key={task.id}
              className={cn(
                "p-3 cursor-pointer active:scale-[0.99] transition-all border-border/50",
                isSelected && "border-primary/50 bg-primary/5"
              )}
              onClick={() => onTaskClick(task)}
            >
              <div className="flex items-start justify-between gap-2">
                {selectable && (
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => task.id && toggleOne(task.id)}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-1.5", priority?.dotColor)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug">{task.title}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs pr-4">
                    {isFromEmail && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEmailClick?.(task.source_reference!);
                        }}
                      >
                        <Mail className="h-2.5 w-2.5 ml-0.5" />
                        מייל
                      </Badge>
                    )}
                    {isAICreated && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30">
                        <Sparkles className="h-2.5 w-2.5 ml-0.5" />
                        AI
                      </Badge>
                    )}
                    {isManual && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        <Pencil className="h-2.5 w-2.5 ml-0.5" />
                        ידני
                      </Badge>
                    )}
                    <div className={cn("flex items-center gap-1", status?.className)}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{status?.label}</span>
                    </div>

                    {assigneeNames && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[80px]">{assigneeNames}</span>
                      </div>
                    )}

                    {task.due_date ? (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(task.due_date), 'd/M', { locale: he })}</span>
                      </div>
                    ) : task.created_at ? (
                      <span className="text-muted-foreground">
                        {format(new Date(task.created_at), 'd/M', { locale: he })}
                      </span>
                    ) : null}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}>
                      עריכה
                    </DropdownMenuItem>
                    {task.approval_status === 'pending' && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onApprove(task);
                      }}>
                        אישור
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (task.id) onDelete(task.id);
                      }}
                    >
                      מחיקה
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// Assignee inline edit popover
function AssigneePopover({
  task,
  employees,
  onUpdate,
}: {
  task: TaskWithDetails;
  employees: { id: string; full_name: string }[];
  onUpdate: (assigneeIds: string[]) => void;
}) {
  const currentAssignees = (task.assignees as { id: string; full_name: string }[] | null) || [];
  const [selected, setSelected] = useState<string[]>(currentAssignees.map(a => a.id));
  const [open, setOpen] = useState(false);

  const displayText = currentAssignees.length > 0
    ? currentAssignees.map(a => a.full_name).filter(Boolean).join(', ')
    : '-';

  const handleToggle = (empId: string) => {
    setSelected(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleSave = () => {
    onUpdate(selected);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        setSelected(currentAssignees.map(a => a.id));
      }
    }}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors text-right">
          <User className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{displayText}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {employees.map((emp) => (
            <label
              key={emp.id}
              className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
            >
              <Checkbox
                checked={selected.includes(emp.id)}
                onCheckedChange={() => handleToggle(emp.id)}
              />
              {emp.full_name}
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-2 pt-2 border-t">
          <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSave}>
            שמור
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(false)}>
            ביטול
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
