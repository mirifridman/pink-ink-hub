import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  created_at: string;
}

const getDailySummaryHtml = (
  userName: string,
  notifications: Notification[],
  baseUrl: string
) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #84cc16, #a3e635); padding: 32px; text-align: center; }
    .header h1 { color: #0f172a; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 32px; color: #e2e8f0; }
    .intro { font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
    .notification-item { background: #334155; padding: 16px; border-radius: 12px; margin-bottom: 12px; border-right: 4px solid #84cc16; }
    .notification-title { font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0 0 8px 0; }
    .notification-message { font-size: 14px; color: #cbd5e1; margin: 0 0 8px 0; }
    .notification-time { font-size: 12px; color: #94a3b8; }
    .button { display: inline-block; background: linear-gradient(135deg, #84cc16, #a3e635); color: #0f172a; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 24px; }
    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 סיכום התראות יומי</h1>
    </div>
    <div class="content">
      <p class="intro">
        שלום <strong>${userName}</strong>,<br>
        יש לך <strong>${notifications.length}</strong> התראות שלא נקראו מהיום:
      </p>
      
      ${notifications.map(notif => `
        <div class="notification-item">
          <h3 class="notification-title">${notif.title}</h3>
          <p class="notification-message">${notif.message}</p>
          <p class="notification-time">${new Date(notif.created_at).toLocaleString('he-IL')}</p>
        </div>
      `).join('')}
      
      <div style="text-align: center;">
        <a href="${baseUrl}/notifications" class="button">צפה בכל ההתראות</a>
      </div>
    </div>
    <div class="footer">
      מטה מנכ״ל - מערכת ניהול משימות
    </div>
  </div>
</body>
</html>
`;

async function sendEmail(to: string, subject: string, html: string) {
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
  const fromName = Deno.env.get("RESEND_FROM_NAME") || "מטה מנכ״ל";
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get app base URL from settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .eq("key", "app_base_url")
      .single();

    const baseUrl = settings?.value as string || "https://mata-mem-rtl-hub.lovable.app";

    // Get today's date range (start of day to now)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const now = new Date().toISOString();

    // Get all users with email notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, email_notifications")
      .eq("email_notifications", true);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No users with email notifications enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    // Process each user
    for (const profile of profiles) {
      try {
        // Get unread notifications from today
        const { data: notifications, error: notifError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", profile.id)
          .eq("is_read", false)
          .gte("created_at", todayStart)
          .lte("created_at", now)
          .order("created_at", { ascending: false });

        if (notifError) {
          errors.push(`Error fetching notifications for ${profile.email}: ${notifError.message}`);
          continue;
        }

        // Only send email if there are unread notifications
        if (!notifications || notifications.length === 0) {
          continue;
        }

        // Send email
        const html = getDailySummaryHtml(
          profile.full_name || profile.email || "משתמש",
          notifications as Notification[],
          baseUrl
        );

        await sendEmail(
          profile.email || "",
          `סיכום התראות יומי - ${notifications.length} התראות חדשות`,
          html
        );

        emailsSent++;
      } catch (error: any) {
        errors.push(`Error processing ${profile.email}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Daily summary sent to ${emailsSent} users`,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in daily notifications summary:", error);
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
