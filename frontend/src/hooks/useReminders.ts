import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Reminder {
  id: string;
  lineup_item_id: string | null;
  insert_id: string | null;
  supplier_id: string | null;
  issue_id: string;
  type: 'assignment' | 'reminder_2days' | 'reminder_urgent' | 'custom';
  message: string;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'cancelled';
  sent_at: string | null;
  sent_by: string | null;
  created_at: string;
  created_by: string;
  content_received?: boolean;
  content_received_date?: string | null;
  reminder_count?: number;
  supplier?: {
    id: string;
    name: string;
    phone: string | null;
  };
  lineup_item?: {
    id: string;
    content: string;
    page_start: number;
    page_end: number;
  };
  issue?: {
    id: string;
    issue_number: number;
    theme: string;
    design_start_date?: string;
    magazine?: {
      name: string;
    };
  };
}

export interface SystemNotification {
  id: string;
  user_id: string;
  type: 'deadline_2days' | 'deadline_today' | 'overdue' | 'assignment_sent' | 'reminder_sent' | 'custom';
  title: string;
  message: string;
  issue_id: string | null;
  lineup_item_id: string | null;
  insert_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ReminderSettings {
  id: string;
  user_id: string;
  supplier_reminder_2days: boolean;
  supplier_reminder_urgent: boolean;
  editor_reminder_2days: boolean;
  editor_reminder_overdue: boolean;
}

// Fetch all reminders
export function useReminders(status?: 'pending' | 'sent' | 'cancelled') {
  return useQuery({
    queryKey: ["reminders", status],
    queryFn: async () => {
      let query = supabase
        .from("reminders")
        .select(`
          *,
          supplier:suppliers(id, name, phone),
          lineup_item:lineup_items(id, content, page_start, page_end),
          issue:issues(id, issue_number, theme, design_start_date, magazine:magazines(name))
        `)
        .order("scheduled_for", { ascending: true });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Reminder[];
    },
  });
}

// Fetch pending reminders count
export function usePendingRemindersCount() {
  return useQuery({
    queryKey: ["reminders", "pending", "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("reminders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
  });
}

// Create reminder
export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reminder: Omit<Reminder, 'id' | 'created_at' | 'created_by' | 'supplier' | 'lineup_item' | 'issue'>) => {
      const { data, error } = await supabase
        .from("reminders")
        .insert({
          ...reminder,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

// Update reminder status
export function useUpdateReminderStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'sent' | 'cancelled' }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
        updateData.sent_by = user?.id;
      }

      const { data, error } = await supabase
        .from("reminders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

// Fetch system notifications
export function useSystemNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["system_notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("system_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SystemNotification[];
    },
    enabled: !!user,
  });
}

// Fetch unread notifications count
export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["system_notifications", "unread", "count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from("system_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("system_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_notifications"] });
    },
  });
}

// Fetch reminder settings
export function useReminderSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reminder_settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("reminder_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ReminderSettings | null;
    },
    enabled: !!user,
  });
}

// Update reminder settings
export function useUpdateReminderSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<ReminderSettings>) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("reminder_settings")
        .upsert({
          user_id: user.id,
          ...settings,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder_settings"] });
    },
  });
}

// Create system notification
export function useCreateSystemNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: Omit<SystemNotification, 'id' | 'created_at' | 'is_read' | 'read_at'>) => {
      const { data, error } = await supabase
        .from("system_notifications")
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_notifications"] });
    },
  });
}

// Get reminder for a specific lineup item
export function useLineupItemReminders(lineupItemId: string | undefined) {
  return useQuery({
    queryKey: ["reminders", "lineup_item", lineupItemId],
    queryFn: async () => {
      if (!lineupItemId) return [];
      
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("lineup_item_id", lineupItemId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Reminder[];
    },
    enabled: !!lineupItemId,
  });
}
