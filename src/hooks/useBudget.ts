import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BudgetItem {
  id: string;
  issue_id: string;
  supplier_id: string | null;
  lineup_item_id: string | null;
  insert_id: string | null;
  description: string;
  page_count: number;
  amount: number;
  notes: string | null;
  is_system_expense: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface BudgetItemWithRelations extends BudgetItem {
  supplier?: { id: string; name: string; supplier_type: string | null } | null;
  issue?: { id: string; issue_number: number; theme: string; magazine_id: string; magazines?: { name: string } } | null;
}

export function useBudgetItems(issueId?: string) {
  return useQuery({
    queryKey: ["budgetItems", issueId],
    queryFn: async () => {
      let query = supabase
        .from("budget_items")
        .select(`
          *,
          supplier:suppliers(id, name, supplier_type),
          issue:issues(id, issue_number, theme, magazine_id, magazines(name))
        `)
        .order("created_at", { ascending: false });
      
      if (issueId) {
        query = query.eq("issue_id", issueId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BudgetItemWithRelations[];
    },
  });
}

export function useCreateBudgetItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<BudgetItem, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("budget_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgetItems"] });
      queryClient.invalidateQueries({ queryKey: ["budgetItems", data.issue_id] });
      toast.success("רשומת תקציב נוספה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בהוספת רשומה: " + error.message);
    },
  });
}

export function useUpdateBudgetItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("budget_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgetItems"] });
      queryClient.invalidateQueries({ queryKey: ["budgetItems", data.issue_id] });
      toast.success("הרשומה עודכנה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון הרשומה: " + error.message);
    },
  });
}

export function useDeleteBudgetItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, issueId }: { id: string; issueId: string }) => {
      const { error } = await supabase
        .from("budget_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return issueId;
    },
    onSuccess: (issueId) => {
      queryClient.invalidateQueries({ queryKey: ["budgetItems"] });
      queryClient.invalidateQueries({ queryKey: ["budgetItems", issueId] });
      toast.success("הרשומה נמחקה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה במחיקת הרשומה: " + error.message);
    },
  });
}

// Import lineup items to budget
export function useImportLineupToBudget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ issueId, userId }: { issueId: string; userId: string }) => {
      // Fetch lineup items that don't have budget entries yet
      const { data: lineupItems, error: lineupError } = await supabase
        .from("lineup_items")
        .select(`
          id,
          content,
          page_start,
          page_end,
          supplier_id
        `)
        .eq("issue_id", issueId);
      
      if (lineupError) throw lineupError;

      // Fetch inserts that don't have budget entries yet
      const { data: inserts, error: insertsError } = await supabase
        .from("inserts")
        .select(`
          id,
          name,
          supplier_id
        `)
        .eq("issue_id", issueId);
      
      if (insertsError) throw insertsError;

      // Check existing budget items to avoid duplicates
      const { data: existingBudget, error: existingError } = await supabase
        .from("budget_items")
        .select("lineup_item_id, insert_id")
        .eq("issue_id", issueId);
      
      if (existingError) throw existingError;

      const existingLineupIds = new Set(existingBudget?.filter(b => b.lineup_item_id).map(b => b.lineup_item_id));
      const existingInsertIds = new Set(existingBudget?.filter(b => b.insert_id).map(b => b.insert_id));

      const budgetItemsToCreate: any[] = [];

      // Add lineup items
      lineupItems?.forEach((item) => {
        if (!existingLineupIds.has(item.id)) {
          budgetItemsToCreate.push({
            issue_id: issueId,
            supplier_id: item.supplier_id,
            lineup_item_id: item.id,
            description: item.content,
            page_count: item.page_end - item.page_start + 1,
            amount: 0,
            created_by: userId,
          });
        }
      });

      // Add inserts
      inserts?.forEach((item) => {
        if (!existingInsertIds.has(item.id)) {
          budgetItemsToCreate.push({
            issue_id: issueId,
            supplier_id: item.supplier_id,
            insert_id: item.id,
            description: item.name,
            page_count: 0,
            amount: 0,
            created_by: userId,
          });
        }
      });

      if (budgetItemsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from("budget_items")
          .insert(budgetItemsToCreate);
        
        if (insertError) throw insertError;
      }

      return budgetItemsToCreate.length;
    },
    onSuccess: (count, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgetItems"] });
      queryClient.invalidateQueries({ queryKey: ["budgetItems", variables.issueId] });
      if (count > 0) {
        toast.success(`${count} פריטים יובאו בהצלחה`);
      } else {
        toast.info("כל הפריטים כבר קיימים בתקציב");
      }
    },
    onError: (error) => {
      toast.error("שגיאה בייבוא פריטים: " + error.message);
    },
  });
}
