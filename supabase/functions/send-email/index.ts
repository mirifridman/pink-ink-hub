import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "approval_request" | "task_assignment" | "reminder" | "bulk_task_assignment";
  recipientEmail?: string;
  to?: string; // alias for recipientEmail
  recipientName?: string;
  taskId?: string;
  taskTitle?: string;
  senderName?: string;
  message?: string;
  approvalToken?: string;
  projectId?: string;
  projectName?: string;
  sentBy?: string;
  tasks?: Array<{ id: string; title: string; description?: string; priority?: string; due_date?: string }>;
}

const getApprovalRequestHtml = (
  taskTitle: string,
  senderName: string,
  message: string | undefined,
  approvalUrl: string
) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #84cc16, #a3e635); padding: 32px; text-align: center; }
    .header-icon { width: 64px; height: 64px; background: rgba(15, 23, 42, 0.2); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
    .header h1 { color: #0f172a; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px; color: #e2e8f0; }
    .intro { font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .intro strong { color: #a3e635; }
    .task-box { background: #334155; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #84cc16; }
    .task-title { font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0; }
    .message-box { background: rgba(132, 204, 22, 0.1); padding: 16px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(132, 204, 22, 0.2); }
    .message-label { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    .message-text { font-style: italic; color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 0; }
    .buttons { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; padding: 14px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #84cc16, #a3e635); color: #0f172a; }
    .expire-note { display: flex; align-items: center; justify-content: center; gap: 8px; color: #fbbf24; font-size: 13px; margin-top: 24px; padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">
        <span style="font-size: 28px;">📋</span>
      </div>
      <h1>בקשת אישור משימה</h1>
    </div>
    <div class="content">
      <p class="intro">שלום,<br><strong>${senderName}</strong> מבקש/ת את אישורך למשימה הבאה:</p>
      
      <div class="task-box">
        <p class="task-title">${taskTitle}</p>
      </div>
      
      ${message ? `
      <div class="message-box">
        <p class="message-label">הודעה מהשולח:</p>
        <p class="message-text">"${message}"</p>
      </div>
      ` : ""}
      
      <div class="buttons">
        <a href="${approvalUrl}" class="btn btn-primary">צפה ואשר משימה</a>
      </div>
      
      <div class="expire-note">
        <span>⏰</span>
        <span>בקשה זו בתוקף ל-7 ימים</span>
      </div>
    </div>
    <div class="footer">
      מטה מנכ״ל - מערכת ניהול משימות ופרויקטים
    </div>
  </div>
</body>
</html>
`;

const getTaskAssignmentHtml = (taskTitle: string, senderName: string, dashboardUrl: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #84cc16, #a3e635); padding: 32px; text-align: center; }
    .header-icon { width: 64px; height: 64px; background: rgba(15, 23, 42, 0.2); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
    .header h1 { color: #0f172a; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px; color: #e2e8f0; }
    .intro { font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .intro strong { color: #a3e635; }
    .task-box { background: #334155; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #84cc16; }
    .task-title { font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0; }
    .buttons { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; padding: 14px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; background: linear-gradient(135deg, #84cc16, #a3e635); color: #0f172a; }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">
        <span style="font-size: 28px;">📋</span>
      </div>
      <h1>שויכת למשימה חדשה</h1>
    </div>
    <div class="content">
      <p class="intro">שלום,<br><strong>${senderName}</strong> שייך/ה אותך למשימה:</p>
      
      <div class="task-box">
        <p class="task-title">${taskTitle}</p>
      </div>
      
      <div class="buttons">
        <a href="${dashboardUrl}" class="btn">צפה במשימות שלי</a>
      </div>
    </div>
    <div class="footer">
      מטה מנכ״ל - מערכת ניהול משימות ופרויקטים
    </div>
  </div>
</body>
</html>
`;

const getReminderHtml = (taskTitle: string, approvalUrl: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #f59e0b, #fbbf24); padding: 32px; text-align: center; }
    .header-icon { width: 64px; height: 64px; background: rgba(15, 23, 42, 0.2); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
    .header h1 { color: #0f172a; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px; color: #e2e8f0; }
    .intro { font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .task-box { background: #334155; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #f59e0b; }
    .task-title { font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0; }
    .buttons { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; padding: 14px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #0f172a; }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">
        <span style="font-size: 28px;">⏰</span>
      </div>
      <h1>תזכורת: בקשת אישור ממתינה</h1>
    </div>
    <div class="content">
      <p class="intro">שלום,<br>יש בקשת אישור שממתינה לתגובתך:</p>
      
      <div class="task-box">
        <p class="task-title">${taskTitle}</p>
      </div>
      
      <div class="buttons">
        <a href="${approvalUrl}" class="btn">צפה ואשר משימה</a>
      </div>
    </div>
    <div class="footer">
      מטה מנכ״ל - מערכת ניהול משימות ופרויקטים
    </div>
  </div>
</body>
</html>
`;

const getBulkTaskAssignmentHtml = (
  tasks: Array<{ title: string; description?: string; priority?: string; due_date?: string }>,
  projectName: string,
  senderName: string,
  message: string | undefined,
  dashboardUrl: string
) => {
  const priorityLabels: Record<string, string> = {
    low: 'נמוכה',
    medium: 'בינונית',
    high: 'גבוהה',
    urgent: 'דחופה',
  };

  const priorityColors: Record<string, string> = {
    low: '#94a3b8',
    medium: '#fbbf24',
    high: '#f97316',
    urgent: '#ef4444',
  };

  const tasksList = tasks.map(task => `
    <div class="task-item">
      <div class="task-title">${task.title}</div>
      ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
      <div class="task-meta">
        ${task.priority ? `<span class="priority" style="background: ${priorityColors[task.priority] || '#84cc16'}20; color: ${priorityColors[task.priority] || '#84cc16'};">${priorityLabels[task.priority] || task.priority}</span>` : ''}
        ${task.due_date ? `<span class="due-date">📅 ${task.due_date}</span>` : ''}
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #84cc16, #a3e635); padding: 32px; text-align: center; }
    .header-icon { width: 64px; height: 64px; background: rgba(15, 23, 42, 0.2); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
    .header h1 { color: #0f172a; margin: 0 0 8px; font-size: 22px; font-weight: 700; }
    .project-name { color: rgba(15, 23, 42, 0.7); font-size: 14px; }
    .content { padding: 32px; color: #e2e8f0; }
    .intro { font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .intro strong { color: #a3e635; }
    .count { display: inline-block; background: #84cc16; color: #0f172a; padding: 2px 10px; border-radius: 12px; font-weight: 600; }
    .message-box { background: rgba(132, 204, 22, 0.1); padding: 16px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(132, 204, 22, 0.2); font-style: italic; color: #cbd5e1; }
    .tasks-list { margin: 24px 0; }
    .task-item { background: #334155; padding: 16px; border-radius: 12px; margin: 10px 0; border-right: 4px solid #84cc16; }
    .task-title { font-size: 15px; font-weight: 600; color: #f8fafc; margin-bottom: 6px; }
    .task-desc { font-size: 13px; color: #94a3b8; margin-bottom: 10px; line-height: 1.4; }
    .task-meta { font-size: 12px; color: #64748b; display: flex; gap: 12px; flex-wrap: wrap; }
    .priority { padding: 3px 10px; border-radius: 6px; font-weight: 500; }
    .due-date { color: #94a3b8; }
    .buttons { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; padding: 14px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; background: linear-gradient(135deg, #84cc16, #a3e635); color: #0f172a; }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">
        <span style="font-size: 28px;">📋</span>
      </div>
      <h1>משימות חדשות מפרויקט</h1>
      <div class="project-name">${projectName}</div>
    </div>
    <div class="content">
      <p class="intro">שלום,<br><strong>${senderName}</strong> שלח/ה אליך <span class="count">${tasks.length}</span> משימות:</p>
      
      ${message ? `<div class="message-box">"${message}"</div>` : ''}
      
      <div class="tasks-list">
        ${tasksList}
      </div>
      
      <div class="buttons">
        <a href="${dashboardUrl}" class="btn">צפה במשימות שלי</a>
      </div>
    </div>
    <div class="footer">
      מטה מנכ״ל - מערכת ניהול משימות ופרויקטים
    </div>
  </div>
</body>
</html>
`;
};


async function sendEmail(to: string, subject: string, html: string, fromAddress?: string) {
  // Use custom from address if provided, otherwise fall back to env or default
  const senderEmail = fromAddress || Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
  const senderName = Deno.env.get("RESEND_FROM_NAME") || "מטה מנכ״ל";
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${senderName} <${senderEmail}>`,
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: EmailRequest = await req.json();
    const {
      type,
      recipientName,
      taskId,
      taskTitle,
      senderName,
      message,
      approvalToken,
      projectId,
      projectName,
      sentBy,
      tasks,
    } = body;

    // Support both 'recipientEmail' and 'to' field names
    const recipientEmail = body.recipientEmail || body.to;

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    // Load email settings from database
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["resend_from_email", "resend_from_name", "app_base_url"]);

    const fromEmail = settings?.find(s => s.key === "resend_from_email")?.value as string || undefined;
    const fromName = settings?.find(s => s.key === "resend_from_name")?.value as string || "מטה מנכ״ל";
    
    // Use published URL for email links (not preview URL which requires auth)
    const baseUrl = settings?.find(s => s.key === "app_base_url")?.value as string || "https://mata-mem-rtl-hub.lovable.app";
    const origin = baseUrl;

    let subject: string;
    let html: string;

    switch (type) {
      case "approval_request":
        subject = `בקשת אישור: ${taskTitle}`;
        html = getApprovalRequestHtml(
          taskTitle || "משימה ללא כותרת",
          senderName || "משתמש",
          message,
          `${origin}/approve/${approvalToken}`
        );
        break;

      case "task_assignment":
        // Handle both single task and bulk tasks
        if (tasks && tasks.length > 0) {
          subject = `${tasks.length} משימות חדשות מפרויקט: ${projectName || 'פרויקט'}`;
          html = getBulkTaskAssignmentHtml(
            tasks,
            projectName || "פרויקט",
            senderName || "משתמש",
            message,
            `${origin}/tasks`
          );
        } else {
          subject = `שויכת למשימה: ${taskTitle}`;
          html = getTaskAssignmentHtml(
            taskTitle || "משימה ללא כותרת",
            senderName || "משתמש",
            `${origin}/tasks`
          );
        }
        break;

      case "reminder":
        subject = `תזכורת: בקשת אישור ממתינה - ${taskTitle}`;
        html = getReminderHtml(
          taskTitle || "משימה ללא כותרת",
          `${origin}/approve/${approvalToken}`
        );
        break;

      default:
        throw new Error("Invalid email type");
    }

    // Build custom from address
    const customFromAddress = fromEmail || undefined;

    // Send email via Resend API
    const emailResponse = await sendEmail(recipientEmail, subject, html, customFromAddress);
    console.log("Email sent successfully:", emailResponse);

    // Log the email
    await supabase.from("email_logs").insert({
      type,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject,
      task_id: taskId,
      project_id: projectId,
      sent_by: sentBy,
      status: "sent",
      metadata: tasks ? { taskIds: tasks.map(t => t.id) } : null,
    });

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    
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
