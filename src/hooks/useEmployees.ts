import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Employee {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  notes: string | null;
  is_active: boolean;
  is_system_user: boolean;
  user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithTasks extends Employee {
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
  }[];
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');

      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useActiveEmployees() {
  return useQuery({
    queryKey: ['employees', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useEmployeeWithTasks(employeeId: string | null) {
  return useQuery({
    queryKey: ['employee', employeeId, 'with-tasks'],
    queryFn: async () => {
      if (!employeeId) return null;

      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (employeeError) throw employeeError;

      const { data: taskAssignees, error: assigneesError } = await supabase
        .from('task_assignees')
        .select('task_id')
        .eq('employee_id', employeeId);

      if (assigneesError) throw assigneesError;

      const taskIds = taskAssignees?.map(ta => ta.task_id) || [];
      
      let tasks: any[] = [];
      if (taskIds.length > 0) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, status, priority')
          .in('id', taskIds)
          .neq('status', 'completed');

        if (tasksError) throw tasksError;
        tasks = tasksData || [];
      }

      return {
        ...employee,
        tasks,
      } as EmployeeWithTasks;
    },
    enabled: !!employeeId,
  });
}

export function useSystemUsers() {
  return useQuery({
    queryKey: ['profiles', 'for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: Partial<Employee>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('employees')
        .insert({
          full_name: employee.full_name!,
          email: employee.email,
          phone: employee.phone,
          position: employee.position,
          department: employee.department,
          notes: employee.notes,
          is_active: employee.is_active ?? true,
          user_id: employee.user_id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'העובד נוסף בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בהוספת עובד', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Employee> & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      toast({ title: 'העובד עודכן בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון עובד', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'העובד נמחק בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת עובד', description: error.message, variant: 'destructive' });
    },
  });
}
