import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  CheckSquare, 
  FolderKanban, 
  Users, 
  FileText,
  Search,
  ArrowLeft
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjectsWithStats } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  const { data: tasks } = useTasks();
  const { data: projects } = useProjectsWithStats();
  const { data: employees } = useEmployees();

  // Reset search when modal opens
  useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  const filteredTasks = useMemo(() => {
    if (!tasks || !search) return tasks?.slice(0, 5) || [];
    return tasks.filter(t => 
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);
  }, [tasks, search]);

  const filteredProjects = useMemo(() => {
    if (!projects || !search) return projects?.slice(0, 5) || [];
    return projects.filter(p => 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);
  }, [projects, search]);

  const filteredEmployees = useMemo(() => {
    if (!employees || !search) return employees?.slice(0, 5) || [];
    return employees.filter(e => 
      e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.position?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);
  }, [employees, search]);

  const handleSelect = (type: string, id?: string) => {
    onOpenChange(false);
    switch (type) {
      case 'task':
        navigate('/tasks');
        break;
      case 'project':
        navigate('/projects');
        break;
      case 'employee':
        navigate('/team');
        break;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="חפש משימות, פרויקטים, עובדים..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center py-6 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-50" />
            <p>לא נמצאו תוצאות</p>
            <p className="text-sm">נסה לחפש משהו אחר</p>
          </div>
        </CommandEmpty>

        {filteredTasks && filteredTasks.length > 0 && (
          <CommandGroup heading="משימות">
            {filteredTasks.map((task) => (
              <CommandItem
                key={task.id}
                onSelect={() => handleSelect('task', task.id || undefined)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <CheckSquare className="h-4 w-4 text-primary" />
                <div className="flex-1 truncate">
                  <p className="font-medium truncate">{task.title}</p>
                  {task.project_name && (
                    <p className="text-xs text-muted-foreground">{task.project_name}</p>
                  )}
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredProjects && filteredProjects.length > 0 && (
          <CommandGroup heading="פרויקטים">
            {filteredProjects.map((project) => (
              <CommandItem
                key={project.id}
                onSelect={() => handleSelect('project', project.id || undefined)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <FolderKanban className="h-4 w-4 text-accent" />
                <div className="flex-1 truncate">
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.tasks_count || 0} משימות
                  </p>
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredEmployees && filteredEmployees.length > 0 && (
          <CommandGroup heading="עובדים">
            {filteredEmployees.map((employee) => (
              <CommandItem
                key={employee.id}
                onSelect={() => handleSelect('employee', employee.id)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Users className="h-4 w-4 text-secondary" />
                <div className="flex-1 truncate">
                  <p className="font-medium truncate">{employee.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.position} {employee.department && `• ${employee.department}`}
                  </p>
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="קיצורי מקשים">
          <CommandItem disabled className="opacity-60">
            <FileText className="h-4 w-4 ml-2" />
            <span className="flex-1">Ctrl+N</span>
            <span className="text-xs text-muted-foreground">משימה חדשה</span>
          </CommandItem>
          <CommandItem disabled className="opacity-60">
            <Search className="h-4 w-4 ml-2" />
            <span className="flex-1">Ctrl+K</span>
            <span className="text-xs text-muted-foreground">חיפוש</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
