import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const N8N_WEBHOOK_URL = Deno.env.get("N8N_EMAIL_TO_TASK_WEBHOOK");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  id: string;
  external_id: string | null;
  sender_name: string;
  sender_address: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  received_at: string;
  attachment_urls: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!N8N_WEBHOOK_URL) {
      console.error("N8N_EMAIL_TO_TASK_WEBHOOK not configured");
      return new Response(
        JSON.stringify({ error: "n8n webhook not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const email: EmailPayload = await req.json();
    console.log("Triggering n8n automation for email:", email.id);

    // Send email data to n8n webhook
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // IMPORTANT: keep a stable identifier that n8n must pass through to the
        // supabase/functions/n8n-webhook so the created task will be linked back
        // to the source email in the UI.
        // Preferred field for linking: source_reference (internal UUID from public.emails.id)
        source_reference: email.id,
        // Backwards-compat / common aliases
        email_id: email.id,
        email_uuid: email.id,
        external_id: email.external_id,
        external_email_id: email.external_id,
        sender_name: email.sender_name,
        sender_address: email.sender_address,
        subject: email.subject,
        body_html: email.body_html,
        body_text: email.body_text,
        received_at: email.received_at,
        attachment_urls: email.attachment_urls,
        // Helpful nested shapes (some n8n flows forward objects rather than flat fields)
        email: {
          id: email.id,
          external_id: email.external_id,
          subject: email.subject,
          received_at: email.received_at,
        },
        context: {
          email_id: email.id,
          external_id: email.external_id,
        },
        triggered_by: user.id,
        triggered_at: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n webhook error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to trigger n8n automation", details: errorText }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let n8nResult;
    try {
      n8nResult = await n8nResponse.json();
    } catch {
      n8nResult = { status: "triggered" };
    }

    console.log("n8n automation triggered successfully:", n8nResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "האוטומציה הופעלה בהצלחה",
        n8n_response: n8nResult,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in trigger-email-automation:", error);
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
