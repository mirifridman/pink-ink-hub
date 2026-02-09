import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProjectWithStats = Database['public']['Views']['projects_with_stats']['Row'];
type ProjectStatus = Database['public']['Enums']['project_status'];

export interface ProjectFilters {
  status?: ProjectStatus | 'all';
}

export function useProjectsWithStats(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ['projects-with-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects_with_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProjectWithStats[];
    },
  });
}

export function useProjectById(projectId: string | null) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('projects_with_stats')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as ProjectWithStats;
    },
    enabled: !!projectId,
  });
}

export function useProjectMembers(projectId: string | null) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          role,
          added_at,
          employee:employees(id, full_name, email, position, department)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useProjectTasks(projectId: string | null) {
  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('tasks_with_details')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useProjectDecisions(projectId: string | null) {
  return useQuery({
    queryKey: ['project-decisions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useProjectDocuments(projectId: string | null) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useProjectStages(projectId: string | null) {
  return useQuery({
    queryKey: ['project-stages', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_stages')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useStageTaskAssignments(stageIds: string[]) {
  return useQuery({
    queryKey: ['stage-task-assignments', stageIds],
    queryFn: async () => {
      if (!stageIds.length) return [];
      
      const { data, error } = await supabase
        .from('task_stage_assignments')
        .select(`
          id,
          stage_id,
          task:tasks(id, title, status, priority)
        `)
        .in('stage_id', stageIds);

      if (error) throw error;
      return data;
    },
    enabled: stageIds.length > 0,
  });
}
