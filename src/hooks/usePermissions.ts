import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PermissionKey = 
  | "view_dashboard"
  | "view_issues"
  | "manage_issues"
  | "view_lineup"
  | "manage_lineup"
  | "edit_lineup_text_ready"
  | "edit_lineup_files_ready"
  | "edit_lineup_is_designed"
  | "view_suppliers"
  | "manage_suppliers"
  | "view_team"
  | "manage_team"
  | "view_reminders"
  | "manage_reminders"
  | "view_schedule"
  | "view_messages"
  | "send_messages"
  | "view_settings"
  | "manage_settings"
  | "view_users"
  | "manage_users";

export interface RolePermission {
  id: string;
  role: string;
  permission_key: PermissionKey;
  is_allowed: boolean;
}

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  view_dashboard: "צפייה בדשבורד",
  view_issues: "צפייה בגיליונות",
  manage_issues: "ניהול גיליונות",
  view_lineup: "צפייה בליינאפ",
  manage_lineup: "ניהול ליינאפ",
  edit_lineup_text_ready: "עדכון סטטוס טקסט בתיקייה",
  edit_lineup_files_ready: "עדכון סטטוס קבצים בתיקייה",
  edit_lineup_is_designed: "עדכון סטטוס מעוצב",
  view_suppliers: "צפייה בספקים",
  manage_suppliers: "ניהול ספקים",
  view_team: "צפייה בצוות",
  manage_team: "ניהול צוות",
  view_reminders: "צפייה בתזכורות",
  manage_reminders: "ניהול תזכורות",
  view_schedule: "צפייה בלוח רבעוני",
  view_messages: "צפייה בהודעות",
  send_messages: "שליחת הודעות",
  view_settings: "צפייה בהגדרות",
  manage_settings: "ניהול הגדרות",
  view_users: "צפייה במשתמשים",
  manage_users: "ניהול משתמשים",
};

export const PERMISSION_GROUPS: { name: string; permissions: PermissionKey[] }[] = [
  {
    name: "דשבורד",
    permissions: ["view_dashboard"],
  },
  {
    name: "גיליונות",
    permissions: ["view_issues", "manage_issues"],
  },
  {
    name: "ליינאפ",
    permissions: ["view_lineup", "manage_lineup"],
  },
  {
    name: "סטטוסים בליינאפ",
    permissions: ["edit_lineup_text_ready", "edit_lineup_files_ready", "edit_lineup_is_designed"],
  },
  {
    name: "ספקים",
    permissions: ["view_suppliers", "manage_suppliers"],
  },
  {
    name: "צוות",
    permissions: ["view_team", "manage_team"],
  },
  {
    name: "תזכורות",
    permissions: ["view_reminders", "manage_reminders"],
  },
  {
    name: "לוח רבעוני",
    permissions: ["view_schedule"],
  },
  {
    name: "הודעות",
    permissions: ["view_messages", "send_messages"],
  },
  {
    name: "הגדרות",
    permissions: ["view_settings", "manage_settings"],
  },
  {
    name: "משתמשים",
    permissions: ["view_users", "manage_users"],
  },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: "מנהל",
  editor: "עורך",
  designer: "מעצב",
  publisher: "צוות הוצאה לאור",
  social: "רשתות חברתיות",
};

export function useRolePermissions() {
  return useQuery({
    queryKey: ["rolePermissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role")
        .order("permission_key");
      if (error) throw error;
      return data as RolePermission[];
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      role,
      permissionKey,
      isAllowed,
    }: {
      role: string;
      permissionKey: PermissionKey;
      isAllowed: boolean;
    }) => {
      const { data, error } = await supabase
        .from("role_permissions")
        .update({ is_allowed: isAllowed })
        .eq("role", role)
        .eq("permission_key", permissionKey)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
      queryClient.invalidateQueries({ queryKey: ["myPermissions"] });
    },
  });
}

export function useMyPermissions() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["myPermissions", role],
    queryFn: async () => {
      if (!role) return {};

      const { data, error } = await supabase
        .from("role_permissions")
        .select("permission_key, is_allowed")
        .eq("role", role);
      if (error) throw error;

      const permissions: Record<string, boolean> = {};
      data?.forEach((p) => {
        permissions[p.permission_key] = p.is_allowed;
      });
      return permissions;
    },
    enabled: !!role,
  });
}

export function useHasPermission(permissionKey: PermissionKey): boolean {
  const { data: permissions, isLoading } = useMyPermissions();
  const { role } = useAuth();

  // Admin always has all permissions as fallback
  if (role === "admin") return true;

  if (isLoading || !permissions) return false;

  return permissions[permissionKey] ?? false;
}
