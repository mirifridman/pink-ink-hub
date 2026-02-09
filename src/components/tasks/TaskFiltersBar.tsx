import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X, Users, Flag, Activity, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useEmployees, type TaskFilters, type TaskSort } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TaskFiltersBarProps {
  filters: TaskFilters;
  sort: TaskSort;
  onFiltersChange: (filters: TaskFilters) => void;
  onSortChange: (sort: TaskSort) => void;
}

const priorityOptions = [
  { value: 'all', label: 'כל העדיפויות' },
  { value: 'urgent', label: 'דחופה', color: 'bg-red-500' },
  { value: 'high', label: 'גבוהה', color: 'bg-orange-500' },
  { value: 'medium', label: 'בינונית', color: 'bg-yellow-500' },
  { value: 'low', label: 'נמוכה', color: 'bg-slate-400' },
];

const statusOptions = [
  { value: 'all', label: 'כל הסטטוסים' },
  { value: 'new', label: 'חדשה' },
  { value: 'approved', label: 'מאושרת' },
  { value: 'in_progress', label: 'בביצוע' },
  { value: 'partial', label: 'הושלם חלקית' },
  { value: 'completed', label: 'הושלמה' },
  { value: 'stuck', label: 'תקוע' },
];

const sortOptions = [
  { value: 'created_at-desc', label: 'תאריך (חדש לישן)' },
  { value: 'created_at-asc', label: 'תאריך (ישן לחדש)' },
  { value: 'due_date-asc', label: 'דד-ליין (קרוב)' },
  { value: 'due_date-desc', label: 'דד-ליין (רחוק)' },
  { value: 'priority-desc', label: 'עדיפות (גבוה)' },
  { value: 'priority-asc', label: 'עדיפות (נמוך)' },
];

export function TaskFiltersBar({ filters, sort, onFiltersChange, onSortChange }: TaskFiltersBarProps) {
  const { data: employees } = useEmployees();

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-') as [TaskSort['field'], TaskSort['direction']];
    onSortChange({ field, direction });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      priority: 'all',
      employeeId: 'all',
      dueDateFrom: undefined,
      dueDateTo: undefined,
    });
  };

  const activeFiltersCount = [
    filters.status && filters.status !== 'all',
    filters.priority && filters.priority !== 'all',
    filters.employeeId && filters.employeeId !== 'all',
    filters.dueDateFrom || filters.dueDateTo,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Employee Filter */}
      <div className="flex items-center gap-2">
        <Select
          value={filters.employeeId || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, employeeId: value })}
        >
          <SelectTrigger className={cn(
            "w-[180px] h-9 text-sm",
            filters.employeeId && filters.employeeId !== 'all' && "border-primary/50 bg-primary/5"
          )}>
            <Users className="h-4 w-4 ml-2 text-muted-foreground" />
            <SelectValue placeholder="כל העובדים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העובדים</SelectItem>
            {employees?.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority Filter */}
      <Select
        value={filters.priority || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, priority: value as TaskFilters['priority'] })}
      >
        <SelectTrigger className={cn(
          "w-[150px] h-9 text-sm",
          filters.priority && filters.priority !== 'all' && "border-primary/50 bg-primary/5"
        )}>
          <Flag className="h-4 w-4 ml-2 text-muted-foreground" />
          <SelectValue placeholder="עדיפות" />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                {opt.color && <div className={cn("h-2 w-2 rounded-full", opt.color)} />}
                {opt.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as TaskFilters['status'] })}
      >
        <SelectTrigger className={cn(
          "w-[150px] h-9 text-sm",
          filters.status && filters.status !== 'all' && "border-primary/50 bg-primary/5"
        )}>
          <Activity className="h-4 w-4 ml-2 text-muted-foreground" />
          <SelectValue placeholder="סטטוס" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Due Date Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'w-[160px] h-9 justify-start text-right font-normal text-sm',
              !filters.dueDateTo && 'text-muted-foreground',
              filters.dueDateTo && "border-primary/50 bg-primary/5"
            )}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {filters.dueDateTo
              ? format(new Date(filters.dueDateTo), 'd בMMM', { locale: he })
              : 'דד-ליין'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dueDateTo ? new Date(filters.dueDateTo) : undefined}
            onSelect={(date) => onFiltersChange({ 
              ...filters, 
              dueDateTo: date ? format(date, 'yyyy-MM-dd') : undefined 
            })}
            locale={he}
          />
        </PopoverContent>
      </Popover>

      {/* Separator */}
      <div className="h-6 w-px bg-border mx-1" />

      {/* Sort */}
      <Select
        value={`${sort.field}-${sort.direction}`}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />
          <SelectValue placeholder="מיון" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4 ml-1" />
          נקה
          <Badge variant="secondary" className="mr-1 h-5 w-5 p-0 justify-center text-xs">
            {activeFiltersCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
