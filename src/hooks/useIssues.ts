import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Issue, Magazine, Supplier, LineupItem, Insert } from "@/types/database";
import { toast } from "sonner";

// Magazines
export function useMagazines() {
  return useQuery({
    queryKey: ["magazines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("magazines")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Magazine[];
    },
  });
}

// Issues
export function useIssues() {
  return useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          magazine:magazines(*)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Issue & { magazine: Magazine })[];
    },
  });
}

export function useIssue(id: string | undefined) {
  return useQuery({
    queryKey: ["issue", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          magazine:magazines(*)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as (Issue & { magazine: Magazine }) | null;
    },
    enabled: !!id,
  });
}

export function useLatestIssueNumber(magazineId: string | undefined) {
  return useQuery({
    queryKey: ["latestIssueNumber", magazineId],
    queryFn: async () => {
      if (!magazineId) return 0;
      const { data, error } = await supabase
        .from("issues")
        .select("issue_number")
        .eq("magazine_id", magazineId)
        .order("issue_number", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data.length > 0 ? data[0].issue_number : 0;
    },
    enabled: !!magazineId,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (issue: Omit<Issue, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("issues")
        .insert(issue)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      toast.success("הגיליון נוצר בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת הגיליון: " + error.message);
    },
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Issue> & { id: string }) => {
      const { data, error } = await supabase
        .from("issues")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue", data.id] });
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון הגיליון: " + error.message);
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete related data first (lineup_items, inserts, issue_editors)
      await supabase.from("lineup_items").delete().eq("issue_id", id);
      await supabase.from("inserts").delete().eq("issue_id", id);
      await supabase.from("issue_editors").delete().eq("issue_id", id);
      
      const { error } = await supabase
        .from("issues")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      toast.success("הגיליון נמחק בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה במחיקת הגיליון: " + error.message);
    },
  });
}

// Suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("suppliers")
        .insert(supplier)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("הספק נוסף בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בהוספת הספק: " + error.message);
    },
  });
}

// Lineup Items
export function useLineupItems(issueId: string | undefined) {
  return useQuery({
    queryKey: ["lineupItems", issueId],
    queryFn: async () => {
      if (!issueId) return [];
      const { data, error } = await supabase
        .from("lineup_items")
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq("issue_id", issueId)
        .order("page_start");
      if (error) throw error;
      return data as (LineupItem & { supplier: Supplier | null })[];
    },
    enabled: !!issueId,
  });
}

export function useCreateLineupItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<LineupItem, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("lineup_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lineupItems", data.issue_id] });
    },
    onError: (error) => {
      toast.error("שגיאה בהוספת פריט: " + error.message);
    },
  });
}

export function useUpdateLineupItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LineupItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("lineup_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lineupItems", data.issue_id] });
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון הפריט: " + error.message);
    },
  });
}

export function useDeleteLineupItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, issueId }: { id: string; issueId: string }) => {
      const { error } = await supabase
        .from("lineup_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return issueId;
    },
    onSuccess: (issueId) => {
      queryClient.invalidateQueries({ queryKey: ["lineupItems", issueId] });
    },
    onError: (error) => {
      toast.error("שגיאה במחיקת הפריט: " + error.message);
    },
  });
}

// Inserts
export function useInserts(issueId: string | undefined) {
  return useQuery({
    queryKey: ["inserts", issueId],
    queryFn: async () => {
      if (!issueId) return [];
      const { data, error } = await supabase
        .from("inserts")
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq("issue_id", issueId)
        .order("name");
      if (error) throw error;
      return data as (Insert & { supplier: Supplier | null })[];
    },
    enabled: !!issueId,
  });
}

export function useCreateInsert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<Insert, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("inserts")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inserts", data.issue_id] });
    },
    onError: (error) => {
      toast.error("שגיאה בהוספת אינסרט: " + error.message);
    },
  });
}

export function useUpdateInsert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Insert> & { id: string }) => {
      const { data, error } = await supabase
        .from("inserts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inserts", data.issue_id] });
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון האינסרט: " + error.message);
    },
  });
}

export function useDeleteInsert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, issueId }: { id: string; issueId: string }) => {
      const { error } = await supabase
        .from("inserts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return issueId;
    },
    onSuccess: (issueId) => {
      queryClient.invalidateQueries({ queryKey: ["inserts", issueId] });
    },
    onError: (error) => {
      toast.error("שגיאה במחיקת האינסרט: " + error.message);
    },
  });
}

// Magazine management
export function useCreateMagazine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (magazine: { name: string }) => {
      const { data, error } = await supabase
        .from("magazines")
        .insert(magazine)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["magazines"] });
    },
  });
}

export function useDeleteMagazine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("magazines")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["magazines"] });
    },
  });
}

// Issue Editors
interface IssueEditor {
  id: string;
  issue_id: string;
  editor_id: string;
  created_at: string;
  editor: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export function useIssueEditors(issueId: string | undefined) {
  return useQuery({
    queryKey: ["issueEditors", issueId],
    queryFn: async () => {
      if (!issueId) return [];
      const { data, error } = await supabase
        .from("issue_editors")
        .select(`
          *,
          editor:profiles(id, full_name, email)
        `)
        .eq("issue_id", issueId);
      if (error) throw error;
      return data as IssueEditor[];
    },
    enabled: !!issueId,
  });
}

export function useAddIssueEditor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ issueId, editorId }: { issueId: string; editorId: string }) => {
      const { data, error } = await supabase
        .from("issue_editors")
        .insert({ issue_id: issueId, editor_id: editorId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["issueEditors", data.issue_id] });
    },
    onError: (error) => {
      toast.error("שגיאה בהוספת עורך: " + error.message);
    },
  });
}

export function useRemoveIssueEditor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, issueId }: { id: string; issueId: string }) => {
      const { error } = await supabase
        .from("issue_editors")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return issueId;
    },
    onSuccess: (issueId) => {
      queryClient.invalidateQueries({ queryKey: ["issueEditors", issueId] });
    },
    onError: (error) => {
      toast.error("שגיאה בהסרת עורך: " + error.message);
    },
  });
}

// Editors list (profiles with editor role)
export function useEditors() {
  return useQuery({
    queryKey: ["editors"],
    queryFn: async () => {
      // First get user_ids with editor/admin roles
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["editor", "admin"]);
      if (roleError) throw roleError;
      
      const userIds = roleData.map(r => r.user_id);
      if (userIds.length === 0) return [];
      
      // Then get their profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      if (profileError) throw profileError;
      
      return profileData as { id: string; full_name: string | null; email: string | null }[];
    },
  });
}

// All users with roles (for settings management)
interface UserWithRole {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "designer" | "editor" | "publisher";
}

export function useAllUsersWithRoles() {
  return useQuery({
    queryKey: ["allUsersWithRoles"],
    queryFn: async () => {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role,
          profile:profiles(id, full_name, email)
        `);
      if (roleError) throw roleError;
      
      return roleData.map(r => ({
        id: r.user_id,
        full_name: (r.profile as any)?.full_name || null,
        email: (r.profile as any)?.email || null,
        role: r.role,
      })) as UserWithRole[];
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "designer" | "editor" | "publisher" }) => {
      // First delete existing role if any
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      // Then insert new role
      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersWithRoles"] });
      queryClient.invalidateQueries({ queryKey: ["editors"] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersWithRoles"] });
      queryClient.invalidateQueries({ queryKey: ["editors"] });
    },
  });
}

// All profiles (for adding new editors)
export function useAllProfiles() {
  return useQuery({
    queryKey: ["allProfiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data as { id: string; full_name: string | null; email: string | null }[];
    },
  });
}

// Pending users (registered but without role)
export function usePendingUsers() {
  return useQuery({
    queryKey: ["pendingUsers"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false });
      if (profilesError) throw profilesError;

      // Get all user_ids that have roles
      const { data: usersWithRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id");
      if (rolesError) throw rolesError;

      const userIdsWithRoles = new Set(usersWithRoles.map(u => u.user_id));

      // Filter profiles without roles
      return profiles.filter(p => !userIdsWithRoles.has(p.id)) as { 
        id: string; 
        full_name: string | null; 
        email: string | null;
        created_at: string;
      }[];
    },
  });
}

// User invitations
interface UserInvitation {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "designer" | "editor" | "publisher";
  invited_by: string;
  created_at: string;
  expires_at: string;
  status: "pending" | "accepted" | "expired";
}

export function useUserInvitations() {
  return useQuery({
    queryKey: ["userInvitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserInvitation[];
    },
  });
}
