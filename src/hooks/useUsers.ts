import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });
}
