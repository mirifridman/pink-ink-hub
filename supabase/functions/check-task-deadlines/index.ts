import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  deadline_reminder_sent: boolean;
  status: string;
  recurrence_type: string | null;
  recurrence_alert_before: string | null;
  recurrence_start_date: string | null;
}

interface TaskAssignee {
  task_id: string;
  employee_id: string;
  user_id: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Get tasks with deadline in 24 hours that haven't been completed and reminder not sent
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, due_date, deadline_reminder_sent, status, recurrence_type, recurrence_alert_before, recurrence_start_date")
      .not("status", "eq", "completed")
      .eq("deadline_reminder_sent", false)
      .gte("due_date", tomorrow.toISOString())
      .lte("due_date", tomorrowEnd.toISOString());

    if (tasksError) throw tasksError;

    let notificationsCreated = 0;
    const taskIdsToUpdate: string[] = [];

    if (tasks && tasks.length > 0) {
      // Get all assignees for these tasks
      const taskIds = tasks.map(t => t.id);
      
      // First get task_assignees
      const { data: taskAssignees, error: assigneesError } = await supabase
        .from("task_assignees")
        .select("task_id, employee_id")
        .in("task_id", taskIds);

      if (assigneesError) throw assigneesError;

      // Get unique employee IDs
      const employeeIds = [...new Set((taskAssignees || []).map(ta => ta.employee_id))];
      
      // Get employees with user_id
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("id, user_id")
        .in("id", employeeIds)
        .not("user_id", "is", null);

      if (employeesError) throw employeesError;

      // Create a map of employee_id to user_id
      const employeeToUserMap = new Map<string, string>();
      if (employees) {
        for (const emp of employees) {
          if (emp.user_id) {
            employeeToUserMap.set(emp.id, emp.user_id);
          }
        }
      }

      // Create a map of task_id to assignees
      const taskAssigneesMap = new Map<string, string[]>();
      
      if (taskAssignees) {
        for (const assignee of taskAssignees) {
          const taskId = assignee.task_id;
          const userId = employeeToUserMap.get(assignee.employee_id);
          
          if (userId) {
            if (!taskAssigneesMap.has(taskId)) {
              taskAssigneesMap.set(taskId, []);
            }
            taskAssigneesMap.get(taskId)!.push(userId);
          }
        }
      }

      // Create notifications for deadline reminders
      for (const task of tasks) {
        const assigneeUserIds = taskAssigneesMap.get(task.id) || [];
        
        if (assigneeUserIds.length > 0) {
          const notifications = assigneeUserIds.map(userId => ({
            user_id: userId,
            title: `תזכורת: המשימה "${task.title}" מסתיימת מחר`,
            message: `המשימה "${task.title}" מסתיימת מחר. אנא ודא שהיא הושלמה בזמן.`,
            type: "task_due",
            link: "/tasks",
          }));

          const { error: notifError } = await supabase
            .from("notifications")
            .insert(notifications);

          if (notifError) {
            console.error(`Error creating notifications for task ${task.id}:`, notifError);
          } else {
            notificationsCreated += notifications.length;
            taskIdsToUpdate.push(task.id);
          }
        }
      }

      // Update tasks to mark reminder as sent
      if (taskIdsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ deadline_reminder_sent: true })
          .in("id", taskIdsToUpdate);

        if (updateError) {
          console.error("Error updating tasks:", updateError);
        }
      }
    }

    // Handle recurring tasks with custom alert times
    const { data: recurringTasks, error: recurringError } = await supabase
      .from("tasks")
      .select("id, title, due_date, recurrence_type, recurrence_alert_before, recurrence_start_date, status")
      .not("recurrence_type", "is", null)
      .not("recurrence_alert_before", "is", null)
      .neq("recurrence_alert_before", "none")
      .not("status", "eq", "completed")
      .not("due_date", "is", null);

    if (recurringError) {
      console.error("Error fetching recurring tasks:", recurringError);
    } else if (recurringTasks && recurringTasks.length > 0) {
      for (const task of recurringTasks) {
        if (!task.due_date || !task.recurrence_alert_before) continue;

        const dueDate = new Date(task.due_date);
        const alertBefore = task.recurrence_alert_before;
        
        // Calculate alert time based on recurrence_alert_before
        let alertTime: Date;
        switch (alertBefore) {
          case "day":
            alertTime = new Date(dueDate);
            alertTime.setDate(alertTime.getDate() - 1);
            break;
          case "week":
            alertTime = new Date(dueDate);
            alertTime.setDate(alertTime.getDate() - 7);
            break;
          case "two_weeks":
            alertTime = new Date(dueDate);
            alertTime.setDate(alertTime.getDate() - 14);
            break;
          case "month":
            alertTime = new Date(dueDate);
            alertTime.setMonth(alertTime.getMonth() - 1);
            break;
          default:
            continue;
        }

        // Check if we're within the alert window (within the last hour)
        const alertWindowStart = new Date(alertTime);
        alertWindowStart.setHours(alertWindowStart.getHours() - 1);
        const alertWindowEnd = new Date(alertTime);
        alertWindowEnd.setHours(alertWindowEnd.getHours() + 1);

        if (now >= alertWindowStart && now <= alertWindowEnd) {
          // Check if notification already sent for this task and alert time
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("type", "task_due")
            .eq("link", "/tasks")
            .gte("created_at", alertWindowStart.toISOString())
            .lte("created_at", alertWindowEnd.toISOString());

          if (count && count > 0) {
            continue; // Already sent
          }

          // Get assignees
          const { data: taskAssignees } = await supabase
            .from("task_assignees")
            .select("employee_id")
            .eq("task_id", task.id);

          if (taskAssignees && taskAssignees.length > 0) {
            const employeeIds = taskAssignees.map(ta => ta.employee_id);
            const { data: employees } = await supabase
              .from("employees")
              .select("user_id")
              .in("id", employeeIds)
              .not("user_id", "is", null);

            const assigneeUserIds = (employees || [])
              .map((e: any) => e.user_id)
              .filter((id: string | null) => id !== null);

            if (assigneeUserIds.length > 0) {
              const timeText = alertBefore === "day" ? "יום" :
                              alertBefore === "week" ? "שבוע" :
                              alertBefore === "two_weeks" ? "שבועיים" :
                              "חודש";

              const notifications = assigneeUserIds.map((userId: string) => ({
                user_id: userId,
                title: `תזכורת: ${task.title}`,
                message: `תזכורת: "${task.title}" בעוד ${timeText}`,
                type: "task_due",
                link: "/tasks",
              }));

              const { error: notifError } = await supabase
                .from("notifications")
                .insert(notifications);

              if (!notifError) {
                notificationsCreated += notifications.length;
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Deadline check completed",
        notificationsCreated,
        tasksChecked: tasks?.length || 0,
        recurringTasksChecked: recurringTasks?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-task-deadlines:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
