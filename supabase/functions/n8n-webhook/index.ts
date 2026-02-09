import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const N8N_WEBHOOK_SECRET = Deno.env.get("N8N_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface TaskPayload {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  due_date?: string;
  project_id?: string;
  stage_id?: string;
  assignee_ids?: string[];
  source_reference?: string;
  email_id?: string; // Alternative field name from n8n
  // Some n8n flows forward the original email external id under this name
  external_id?: string;
  external_email_id?: string; // External ID from email provider
  attachment_urls?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const providedSecret = req.headers.get("x-webhook-secret");
    
    if (N8N_WEBHOOK_SECRET && providedSecret !== N8N_WEBHOOK_SECRET) {
      console.error("Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: TaskPayload = await req.json();

    // Helpful debug: log shape (without dumping full content)
    try {
      const anyPayload = payload as any;
      console.log("n8n-webhook payload keys:", Object.keys(anyPayload ?? {}));
      if (anyPayload?.email && typeof anyPayload.email === "object") {
        console.log("n8n-webhook payload.email keys:", Object.keys(anyPayload.email));
      }
      if (anyPayload?.context && typeof anyPayload.context === "object") {
        console.log("n8n-webhook payload.context keys:", Object.keys(anyPayload.context));
      }
    } catch {
      // ignore logging errors
    }

    // Validate required fields
    if (!payload.title || payload.title.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Task title is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Determine source_reference (support multiple field names used by n8n workflows)
    const anyPayload = payload as any;
    const sourceReference =
      payload.source_reference ||
      // common variants
      (anyPayload.sourceReference as string | undefined) ||
      payload.email_id ||
      (anyPayload.emailId as string | undefined) ||
      // external ids
      payload.external_email_id ||
      payload.external_id ||
      (anyPayload.externalEmailId as string | undefined) ||
      (anyPayload.email_external_id as string | undefined) ||
      // nested shapes
      (anyPayload.email?.id as string | undefined) ||
      (anyPayload.email?.external_id as string | undefined) ||
      (anyPayload.email?.externalId as string | undefined) ||
      (anyPayload.context?.email_id as string | undefined) ||
      (anyPayload.context?.external_id as string | undefined) ||
      (anyPayload.context?.emailId as string | undefined) ||
      null;
    const hasEmailSource = !!sourceReference;
    
    console.log("Creating task with source_reference:", sourceReference, "hasEmailSource:", hasEmailSource);

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        title: payload.title,
        description: payload.description || null,
        priority: payload.priority || "medium",
        due_date: payload.due_date || null,
        project_id: payload.project_id || null,
        stage_id: payload.stage_id || null,
        status: "new",
        approval_status: "pending",
        source: hasEmailSource ? "email" : "n8n",
        source_reference: sourceReference,
      })
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task:", taskError);
      throw taskError;
    }

    console.log("Task created from n8n webhook:", task.id);

    // Add attachments as documents if provided
    if (payload.attachment_urls && payload.attachment_urls.length > 0) {
      const documentsData = payload.attachment_urls.map((url, index) => ({
        entity_type: "task",
        entity_id: task.id,
        name: url.split("/").pop() || `קובץ ${index + 1}`,
        file_path: url,
      }));

      const { error: docsError } = await supabase
        .from("documents")
        .insert(documentsData);

      if (docsError) {
        console.error("Error adding documents:", docsError);
        // Don't fail the whole request for document errors
      } else {
        console.log(`Added ${payload.attachment_urls.length} attachments to task ${task.id}`);
      }
    }

    // Add assignees if provided
    if (payload.assignee_ids && payload.assignee_ids.length > 0) {
      const assigneeInserts = payload.assignee_ids.map((employeeId) => ({
        task_id: task.id,
        employee_id: employeeId,
      }));

      const { error: assigneeError } = await supabase
        .from("task_assignees")
        .insert(assigneeInserts);

      if (assigneeError) {
        console.error("Error adding assignees:", assigneeError);
        // Don't fail the whole request for assignee errors
      } else {
        // Get user_ids for push notifications
        const { data: employees } = await supabase
          .from("employees")
          .select("user_id")
          .in("id", payload.assignee_ids)
          .not("user_id", "is", null);

        if (employees && employees.length > 0) {
          const userIds = employees
            .map((emp) => emp.user_id)
            .filter((id): id is string => id !== null);

          if (userIds.length > 0) {
            // Import and use web-push to send notifications
            const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
            const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

            if (vapidPublicKey && vapidPrivateKey) {
              // Get push subscriptions for assigned users
              const { data: subscriptions } = await supabase
                .from("push_subscriptions")
                .select("*")
                .in("user_id", userIds);

              if (subscriptions && subscriptions.length > 0) {
                const { default: webpush } = await import("https://esm.sh/web-push@3.6.7");
                
                webpush.setVapidDetails(
                  "mailto:admin@mata-mem.com",
                  vapidPublicKey,
                  vapidPrivateKey
                );

                const notificationPayload = JSON.stringify({
                  title: "משימה חדשה הוקצתה לך",
                  body: payload.title,
                  url: `/tasks?task=${task.id}`,
                  tag: "task-assignment",
                });

                for (const sub of subscriptions) {
                  try {
                    await webpush.sendNotification(
                      {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                      },
                      notificationPayload
                    );
                    console.log(`Push sent to user ${sub.user_id}`);
                  } catch (pushError: any) {
                    console.error(`Push failed for ${sub.endpoint}:`, pushError.message);
                  }
                }
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        task_id: task.id,
        message: "Task created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in n8n-webhook function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
