import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const N8N_WEBHOOK_URL = Deno.env.get("N8N_EMAIL_REPLY_WEBHOOK");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReplyPayload {
  email_id: string;
  original_external_id: string | null;
  original_subject: string;
  original_sender_name: string;
  original_sender_address: string;
  reply_text: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!N8N_WEBHOOK_URL) {
      console.error("N8N_EMAIL_REPLY_WEBHOOK not configured");
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

    // Get user profile for sender info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const payload: ReplyPayload = await req.json();
    console.log("Sending email reply via n8n webhook for email:", payload.email_id);

    // Send reply data to n8n webhook
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_id: payload.email_id,
        original_id: payload.email_id,
        original_external_id: payload.original_external_id,
        original_subject: payload.original_subject,
        original_sender_name: payload.original_sender_name,
        original_sender_address: payload.original_sender_address,
        reply_text: payload.reply_text,
        reply_subject: `Re: ${payload.original_subject}`,
        replier_name: profile?.full_name || "מטה מנכ״ל",
        replier_email: profile?.email || user.email,
        replier_user_id: user.id,
        sent_at: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n webhook error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send reply via n8n", details: errorText }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let n8nResult;
    try {
      n8nResult = await n8nResponse.json();
    } catch {
      n8nResult = { status: "sent" };
    }

    console.log("Email reply sent successfully via n8n:", n8nResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "התשובה נשלחה בהצלחה",
        n8n_response: n8nResult,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-reply:", error);
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
