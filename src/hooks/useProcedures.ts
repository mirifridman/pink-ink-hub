import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Procedure {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcedureWithStats extends Procedure {
  documents_count: number;
}

export function useProcedures() {
  return useQuery({
    queryKey: ['procedures'],
    queryFn: async () => {
      const { data: procedures, error } = await supabase
        .from('procedures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get document counts
      const procedureIds = procedures.map(p => p.id);
      const { data: documents } = await supabase
        .from('documents')
        .select('entity_id')
        .eq('entity_type', 'procedure')
        .in('entity_id', procedureIds);

      const docCounts = procedureIds.reduce((acc, id) => {
        acc[id] = documents?.filter(d => d.entity_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      return procedures.map(p => ({
        ...p,
        documents_count: docCounts[p.id] || 0,
      })) as ProcedureWithStats[];
    },
  });
}

export function useProcedure(id: string | null) {
  return useQuery({
    queryKey: ['procedure', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Procedure;
    },
    enabled: !!id,
  });
}

export function useCreateProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (procedure: Partial<Procedure>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('procedures')
        .insert({
          title: procedure.title!,
          content: procedure.content,
          category: procedure.category,
          is_active: procedure.is_active ?? true,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast({ title: 'הנוהל נוצר בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה ביצירת נוהל', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Procedure> & { id: string }) => {
      const { data, error } = await supabase
        .from('procedures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      queryClient.invalidateQueries({ queryKey: ['procedure'] });
      toast({ title: 'הנוהל עודכן בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון נוהל', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('procedures')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast({ title: 'הנוהל נמחק בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת נוהל', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['procedure-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      const categories = [...new Set(data.map(p => p.category).filter(Boolean))];
      return categories as string[];
    },
  });
}
