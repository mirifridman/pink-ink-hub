import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_name?: string;
}

export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
}

// System Settings Hooks
export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return data as SystemSetting[];
    },
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ['system-setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return data as SystemSetting | null;
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if setting exists
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('system_settings')
          .update({ value, updated_by: user?.id })
          .eq('key', key)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('system_settings')
          .insert({ key, value, updated_by: user?.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-setting'] });
      toast({ title: 'ההגדרה נשמרה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בשמירת הגדרה', description: error.message, variant: 'destructive' });
    },
  });
}

// Audit Logs Hooks
export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59');
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.action) {
        query = query.ilike('action', `%${filters.action}%`);
      }

      const { data: logs, error } = await query;
      if (error) throw error;

      // Get user names
      const userIds = [...new Set(logs.filter(l => l.user_id).map(l => l.user_id))];
      let userMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (profiles) {
          userMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.full_name || 'משתמש לא ידוע';
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return logs.map(log => ({
        ...log,
        user_name: log.user_id ? userMap[log.user_id] || 'משתמש לא ידוע' : 'מערכת',
      })) as AuditLog[];
    },
  });
}

// Users Management Hooks
export function useAllProfiles() {
  return useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      toast({ title: 'המשתמש עודכן בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון משתמש', description: error.message, variant: 'destructive' });
    },
  });
}

// Log action helper
export async function logAction(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: any
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.rpc('log_action', {
    p_user_id: user?.id,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_details: details,
  });
}
