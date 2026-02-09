import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];
type TaskPriority = Database['public']['Enums']['task_priority'];
type TaskStatus = Database['public']['Enums']['task_status'];
type ApprovalStatus = Database['public']['Enums']['approval_status'];

export interface TaskFilters {
  status?: TaskStatus | 'all';
  approvalStatus?: ApprovalStatus | 'all';
  priority?: TaskPriority | 'all';
  employeeId?: string | 'all';
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface TaskSort {
  field: 'created_at' | 'due_date' | 'priority';
  direction: 'asc' | 'desc';
}

export function useTasks(filters?: TaskFilters, sort?: TaskSort) {
  return useQuery({
    queryKey: ['tasks', filters, sort],
    queryFn: async () => {
      let query = supabase
        .from('tasks_with_details')
        .select('*');

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.approvalStatus && filters.approvalStatus !== 'all') {
        query = query.eq('approval_status', filters.approvalStatus);
      }
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.dueDateFrom) {
        query = query.gte('due_date', filters.dueDateFrom);
      }
      if (filters?.dueDateTo) {
        query = query.lte('due_date', filters.dueDateTo);
      }

      // Apply sorting
      const sortField = sort?.field || 'created_at';
      const sortDirection = sort?.direction || 'desc';
      
      if (sortField === 'priority') {
        // Custom priority order
        query = query.order('priority', { ascending: sortDirection === 'asc' });
      } else {
        query = query.order(sortField, { ascending: sortDirection === 'asc', nullsFirst: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by employee if needed (requires checking assignees JSON)
      let filteredData = data as TaskWithDetails[];
      if (filters?.employeeId && filters.employeeId !== 'all') {
        filteredData = filteredData.filter(task => {
          const assignees = task.assignees as { id: string }[] | null;
          return assignees?.some(a => a.id === filters.employeeId);
        });
      }

      return filteredData;
    },
  });
}

export function useTasksCount() {
  return useQuery({
    queryKey: ['tasks-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .in('status', ['planning', 'active'])
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}
