import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Decision {
  id: string;
  title: string;
  description: string | null;
  decision_date: string | null;
  decided_by: string | null;
  project_id: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionWithDetails extends Decision {
  project_name: string | null;
  documents_count: number;
}

export function useDecisions(projectId?: string | null) {
  return useQuery({
    queryKey: ['decisions', projectId],
    queryFn: async () => {
      let query = supabase
        .from('decisions')
        .select('*')
        .order('decision_date', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: decisions, error } = await query;
      if (error) throw error;

      // Get project names
      const projectIds = decisions.filter(d => d.project_id).map(d => d.project_id);
      let projects: any[] = [];
      if (projectIds.length > 0) {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);
        projects = projectsData || [];
      }

      // Get document counts
      const decisionIds = decisions.map(d => d.id);
      const { data: documents } = await supabase
        .from('documents')
        .select('entity_id')
        .eq('entity_type', 'decision')
        .in('entity_id', decisionIds);

      return decisions.map(d => ({
        ...d,
        project_name: projects.find(p => p.id === d.project_id)?.name || null,
        documents_count: documents?.filter(doc => doc.entity_id === d.id).length || 0,
      })) as DecisionWithDetails[];
    },
  });
}

export function useDecision(id: string | null) {
  return useQuery({
    queryKey: ['decision', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Decision;
    },
    enabled: !!id,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (decision: Partial<Decision>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('decisions')
        .insert({
          title: decision.title!,
          description: decision.description,
          decision_date: decision.decision_date,
          decided_by: decision.decided_by,
          project_id: decision.project_id,
          status: decision.status || 'active',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      toast({ title: 'ההחלטה נוצרה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה ביצירת החלטה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Decision> & { id: string }) => {
      const { data, error } = await supabase
        .from('decisions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      queryClient.invalidateQueries({ queryKey: ['decision'] });
      toast({ title: 'ההחלטה עודכנה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון החלטה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('decisions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      toast({ title: 'ההחלטה נמחקה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת החלטה', description: error.message, variant: 'destructive' });
    },
  });
}
