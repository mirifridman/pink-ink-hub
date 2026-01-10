import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TeamReminder {
  id: string;
  title: string | null;
  message: string;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'cancelled';
  is_personal: boolean;
  target_user_id: string | null;
  created_by: string;
  created_at: string;
  sender_name?: string;
}

// Fetch reminders targeted to current user (personal + from others)
export function useMyReminders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["team-reminders", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("reminders")
        .select(`
          id,
          title,
          message,
          scheduled_for,
          status,
          is_personal,
          target_user_id,
          created_by,
          created_at
        `)
        .eq("target_user_id", user.id)
        .not("is_personal", "is", null)
        .order("scheduled_for", { ascending: true });

      if (error) throw error;

      // Get sender names for team reminders
      const remindersWithSenders = await Promise.all(
        (data || []).map(async (reminder) => {
          if (!reminder.is_personal && reminder.created_by !== user.id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", reminder.created_by)
              .single();
            
            return {
              ...reminder,
              sender_name: profile?.full_name || profile?.email || "משתמש"
            };
          }
          return reminder;
        })
      );

      return remindersWithSenders as TeamReminder[];
    },
    enabled: !!user,
  });
}

// Create a new team/personal reminder
export function useCreateTeamReminder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reminder: {
      title: string;
      message: string;
      scheduled_for: string;
      is_personal: boolean;
      target_user_id?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // For personal reminders or team reminders, we need a valid issue_id
      // We'll use a placeholder approach - get any active issue
      const { data: activeIssue } = await supabase
        .from("issues")
        .select("id")
        .in("status", ["draft", "in_progress", "review"])
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from("reminders")
        .insert({
          title: reminder.title,
          message: reminder.message,
          scheduled_for: reminder.scheduled_for,
          is_personal: reminder.is_personal,
          target_user_id: reminder.target_user_id || user.id,
          created_by: user.id,
          type: "custom",
          status: "pending",
          issue_id: activeIssue?.id || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // If sending to another user, create a system notification
      if (!reminder.is_personal && reminder.target_user_id && reminder.target_user_id !== user.id) {
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        await supabase.from("system_notifications").insert({
          user_id: reminder.target_user_id,
          type: "team_reminder",
          title: `תזכורת חדשה מ${senderProfile?.full_name || senderProfile?.email || "חבר צוות"}`,
          message: reminder.title,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["system_notifications"] });
    },
  });
}

// Get team members for sending reminders
export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });
}

// Mark team reminder as done
export function useMarkReminderDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminders")
        .update({ status: "sent" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}