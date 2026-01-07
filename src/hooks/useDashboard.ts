import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, format } from "date-fns";

// Active issues with progress
export function useActiveIssues() {
  return useQuery({
    queryKey: ["dashboard-active-issues"],
    queryFn: async () => {
      // Get active issues (not archived/closed)
      const { data: issues, error: issuesError } = await supabase
        .from("issues")
        .select(`
          id,
          issue_number,
          theme,
          status,
          template_pages,
          magazine:magazines(name)
        `)
        .in("status", ["draft", "in_progress", "review"])
        .order("created_at", { ascending: false });

      if (issuesError) throw issuesError;

      // Get lineup items for each issue to calculate progress
      const issuesWithProgress = await Promise.all(
        (issues || []).map(async (issue) => {
          const { data: lineupItems } = await supabase
            .from("lineup_items")
            .select("id, is_designed, text_ready, files_ready")
            .eq("issue_id", issue.id);

          const totalItems = lineupItems?.length || 0;
          const completedItems = lineupItems?.filter(
            (item) => item.is_designed && item.text_ready && item.files_ready
          ).length || 0;

          const progress = totalItems > 0 
            ? Math.round((completedItems / totalItems) * 100) 
            : 0;

          return {
            id: issue.id,
            name: issue.magazine?.name || issue.theme,
            number: issue.issue_number,
            progress,
            totalItems,
            completedItems,
          };
        })
      );

      return issuesWithProgress;
    },
  });
}

// Pending tasks (lineup items that need work)
export function usePendingTasks() {
  return useQuery({
    queryKey: ["dashboard-pending-tasks"],
    queryFn: async () => {
      // Get lineup items that are not fully complete
      const { data: lineupItems, error } = await supabase
        .from("lineup_items")
        .select(`
          id,
          content,
          text_ready,
          files_ready,
          is_designed,
          issue:issues(
            id,
            issue_number,
            sketch_close_date,
            design_start_date,
            magazine:magazines(name)
          )
        `)
        .or("text_ready.eq.false,files_ready.eq.false,is_designed.eq.false")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const today = new Date();

      return (lineupItems || []).map((item) => {
        const deadline = item.issue?.sketch_close_date 
          ? parseISO(item.issue.sketch_close_date) 
          : null;
        
        const daysLeft = deadline 
          ? differenceInDays(deadline, today) 
          : 999;

        let status: "critical" | "urgent" | "warning" | "success" | "waiting";
        if (daysLeft <= 0) {
          status = "critical";
        } else if (daysLeft <= 2) {
          status = "urgent";
        } else if (daysLeft <= 7) {
          status = "warning";
        } else {
          status = "waiting";
        }

        return {
          id: item.id,
          title: item.content,
          magazine: `${item.issue?.magazine?.name || "מגזין"} - גליון ${item.issue?.issue_number}`,
          deadline: deadline ? format(deadline, "dd/MM/yyyy") : "ללא תאריך",
          daysLeft,
          status,
        };
      }).sort((a, b) => a.daysLeft - b.daysLeft);
    },
  });
}

// Pending reminders
export function usePendingReminders() {
  return useQuery({
    queryKey: ["dashboard-pending-reminders"],
    queryFn: async () => {
      const { data: reminders, error } = await supabase
        .from("reminders")
        .select(`
          id,
          message,
          type,
          status,
          scheduled_for,
          supplier:suppliers(id, name, email, phone),
          lineup_item:lineup_items(id, content),
          insert:inserts(id, name)
        `)
        .eq("status", "pending")
        .order("scheduled_for", { ascending: true })
        .limit(10);

      if (error) throw error;

      const today = new Date();

      return (reminders || []).map((reminder) => {
        const scheduledFor = parseISO(reminder.scheduled_for);
        const daysLeft = differenceInDays(scheduledFor, today);

        let type: "critical" | "urgent";
        if (daysLeft <= 0) {
          type = "critical";
        } else {
          type = "urgent";
        }

        // Determine contact method based on supplier info
        const hasEmail = !!reminder.supplier?.email;
        const hasPhone = !!reminder.supplier?.phone;
        let contactMethod: "email" | "whatsapp" | "both";
        if (hasEmail && hasPhone) {
          contactMethod = "both";
        } else if (hasEmail) {
          contactMethod = "email";
        } else {
          contactMethod = "whatsapp";
        }

        return {
          id: reminder.id,
          supplierName: reminder.supplier?.name || "ספק לא ידוע",
          itemTitle: reminder.lineup_item?.content || reminder.insert?.name || reminder.message,
          type,
          contactMethod,
        };
      });
    },
  });
}

// Urgent items counts
export function useUrgentItemsCounts() {
  return useQuery({
    queryKey: ["dashboard-urgent-items"],
    queryFn: async () => {
      const today = new Date();

      // Get all incomplete lineup items with their issue dates
      const { data: lineupItems, error } = await supabase
        .from("lineup_items")
        .select(`
          id,
          text_ready,
          files_ready,
          is_designed,
          issue:issues(sketch_close_date)
        `)
        .or("text_ready.eq.false,files_ready.eq.false,is_designed.eq.false");

      if (error) throw error;

      let critical = 0;
      let urgent = 0;
      let normal = 0;

      (lineupItems || []).forEach((item) => {
        const deadline = item.issue?.sketch_close_date 
          ? parseISO(item.issue.sketch_close_date) 
          : null;
        
        if (!deadline) {
          normal++;
          return;
        }

        const daysLeft = differenceInDays(deadline, today);

        if (daysLeft <= 0) {
          critical++;
        } else if (daysLeft <= 2) {
          urgent++;
        } else {
          normal++;
        }
      });

      return { critical, urgent, normal };
    },
  });
}
