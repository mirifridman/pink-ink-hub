import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Magazine {
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
}

interface LineupItem {
  id: string;
  content: string;
  page_start: number;
  page_end: number;
  text_ready: boolean;
  files_ready: boolean;
  supplier_id: string | null;
  supplier: Supplier | null;
}

interface Issue {
  id: string;
  issue_number: number;
  theme: string;
  design_start_date: string;
  sketch_close_date: string;
  print_date: string;
  magazine: Magazine | null;
  lineup_items: LineupItem[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting daily reminder check...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    // Fetch active issues with their lineup items
    const { data: issues, error: issuesError } = await supabase
      .from("issues")
      .select(`
        id,
        issue_number,
        theme,
        design_start_date,
        sketch_close_date,
        print_date,
        magazine:magazines(name),
        lineup_items(
          id,
          content,
          page_start,
          page_end,
          text_ready,
          files_ready,
          supplier_id,
          supplier:suppliers(id, name, phone)
        )
      `)
      .in("status", ["in_progress", "draft"])
      .gte("print_date", today.toISOString());

    if (issuesError) {
      console.error("Error fetching issues:", issuesError);
      throw issuesError;
    }

    console.log(`Found ${issues?.length || 0} active issues`);

    const remindersToCreate: Record<string, unknown>[] = [];
    const notificationsToCreate: Record<string, unknown>[] = [];

    // Get all editors for notifications
    const { data: editors } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["editor", "admin"]);

    const editorIds = editors?.map((e: { user_id: string }) => e.user_id) || [];

    for (const issueData of issues || []) {
      // Type assertion for the nested data
      const issue = issueData as unknown as Issue;
      
      const designStartDate = new Date(issue.design_start_date);
      const sketchCloseDate = new Date(issue.sketch_close_date);
      const printDate = new Date(issue.print_date);
      
      const magazineName = issue.magazine?.name || "מגזין";
      
      // Check each lineup item
      for (const item of issue.lineup_items || []) {
        if (!item.supplier_id || !item.supplier) continue;
        
        const daysUntilDesignStart = Math.ceil((designStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if text is not ready
        if (!item.text_ready) {
          const pages = item.page_start === item.page_end 
            ? String(item.page_start) 
            : `${item.page_start}-${item.page_end}`;

          // 2 days before design_start_date
          if (daysUntilDesignStart === 2) {
            // Check if reminder already exists
            const { data: existingReminder } = await supabase
              .from("reminders")
              .select("id")
              .eq("lineup_item_id", item.id)
              .eq("type", "reminder_2days")
              .single();

            if (!existingReminder) {
              remindersToCreate.push({
                lineup_item_id: item.id,
                supplier_id: item.supplier_id,
                issue_id: issue.id,
                type: "reminder_2days",
                message: `שלום ${item.supplier.name},\n\nתזכורת: נותרו יומיים להגשה!\n📄 מדור: ${item.content}\n📐 עמודים: ${pages}\n📅 יש להגיש עד: ${designStartDate.toLocaleDateString('he-IL')}\n\nבברכה`,
                scheduled_for: new Date().toISOString(),
                status: "pending",
                created_by: editorIds[0] || null,
              });
            }
          }

          // On design_start_date (urgent)
          if (daysUntilDesignStart === 0) {
            const { data: existingReminder } = await supabase
              .from("reminders")
              .select("id")
              .eq("lineup_item_id", item.id)
              .eq("type", "reminder_urgent")
              .single();

            if (!existingReminder) {
              remindersToCreate.push({
                lineup_item_id: item.id,
                supplier_id: item.supplier_id,
                issue_id: issue.id,
                type: "reminder_urgent",
                message: `שלום ${item.supplier.name},\n\n⚠️ היום הוא יום ההגשה!\n📄 מדור: ${item.content}\n\nנא לשלוח בהקדם.\n\nבברכה`,
                scheduled_for: new Date().toISOString(),
                status: "pending",
                created_by: editorIds[0] || null,
              });
            }
          }

          // Overdue notification for editors
          if (daysUntilDesignStart < 0) {
            for (const editorId of editorIds) {
              const { data: existingNotification } = await supabase
                .from("system_notifications")
                .select("id")
                .eq("user_id", editorId)
                .eq("lineup_item_id", item.id)
                .eq("type", "overdue")
                .single();

              if (!existingNotification) {
                notificationsToCreate.push({
                  user_id: editorId,
                  type: "overdue",
                  title: "תוכן באיחור!",
                  message: `${item.content} - ${item.supplier.name} (${magazineName} #${issue.issue_number})`,
                  issue_id: issue.id,
                  lineup_item_id: item.id,
                });
              }
            }
          }
        }
      }

      // Check deadline notifications for editors
      for (const editorId of editorIds) {
        // 2 days before design_start
        const daysToDesignStart = Math.ceil((designStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToDesignStart === 2) {
          notificationsToCreate.push({
            user_id: editorId,
            type: "deadline_2days",
            title: "יומיים עד תחילת עיצוב",
            message: `${magazineName} גיליון ${issue.issue_number} - ${issue.theme}`,
            issue_id: issue.id,
          });
        }

        // 2 days before sketch_close
        const daysToSketchClose = Math.ceil((sketchCloseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToSketchClose === 2) {
          notificationsToCreate.push({
            user_id: editorId,
            type: "deadline_2days",
            title: "יומיים עד סגירת סקיצות",
            message: `${magazineName} גיליון ${issue.issue_number} - ${issue.theme}`,
            issue_id: issue.id,
          });
        }

        // 2 days before print
        const daysToPrint = Math.ceil((printDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToPrint === 2) {
          notificationsToCreate.push({
            user_id: editorId,
            type: "deadline_2days",
            title: "יומיים עד הדפסה",
            message: `${magazineName} גיליון ${issue.issue_number} - ${issue.theme}`,
            issue_id: issue.id,
          });
        }
      }
    }

    // Insert reminders
    if (remindersToCreate.length > 0) {
      const { error: reminderError } = await supabase
        .from("reminders")
        .insert(remindersToCreate);

      if (reminderError) {
        console.error("Error creating reminders:", reminderError);
      } else {
        console.log(`Created ${remindersToCreate.length} reminders`);
      }
    }

    // Insert notifications
    if (notificationsToCreate.length > 0) {
      const { error: notificationError } = await supabase
        .from("system_notifications")
        .insert(notificationsToCreate);

      if (notificationError) {
        console.error("Error creating notifications:", notificationError);
      } else {
        console.log(`Created ${notificationsToCreate.length} notifications`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_created: remindersToCreate.length,
        notifications_created: notificationsToCreate.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
