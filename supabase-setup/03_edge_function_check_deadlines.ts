// Supabase Edge Function: check-deadlines
// 
// This is a CRON function that runs daily to check for upcoming deadlines
// and send reminder emails.
//
// Deploy this function to Supabase:
// 1. Go to Supabase Dashboard > Edge Functions
// 2. Click "Create a new function"
// 3. Name it "check-deadlines"
// 4. Paste this code
// 5. Set up a CRON job to run daily (e.g., at 8:00 AM)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email template for deadline reminder
function deadlineReminderHtml(data: {
  editorName: string;
  issueName: string;
  contentItems: Array<{ title: string; pages: string }>;
  deadline: string;
  daysLeft: number;
}): string {
  const urgencyClass = data.daysLeft <= 1 ? 'background: #FEE2E2; border-right: 4px solid #EF4444;' : 'background: #EFF6FF; border-right: 4px solid #3B82F6;';
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { background: #F9FAFB; padding: 20px 30px; text-align: center; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.daysLeft <= 1 ? '🚨' : '⏰'} תזכורת דדליין</h1>
        </div>
        <div class="content">
          <p><strong>שלום ${data.editorName},</strong></p>
          <p>יש לך תכנים לגיליון <strong>${data.issueName}</strong> שממתינים.</p>
          <div style="${urgencyClass} padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>⏰ דדליין:</strong> ${new Date(data.deadline).toLocaleDateString('he-IL')}
            (${data.daysLeft > 0 ? `עוד ${data.daysLeft} ימים` : 'היום!'})
          </div>
          <h3>תכנים שצריך להעלות:</h3>
          <ul>
            ${data.contentItems.map(item => `<li><strong>${item.title}</strong> - עמודים ${item.pages}</li>`).join('')}
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://magazinepro.app/lineup" class="button">כנס למערכת</a>
          </div>
        </div>
        <div class="footer">
          <p>מגזין פרו - מערכת ניהול הפקה</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Find issues with upcoming deadlines (sketch_close_date)
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select(`
        id,
        issue_number,
        theme,
        sketch_close_date,
        lineup_items (
          id,
          content,
          page_start,
          page_end,
          text_ready,
          files_ready,
          responsible_editor_id
        )
      `)
      .gte('sketch_close_date', today.toISOString().split('T')[0])
      .lte('sketch_close_date', threeDaysFromNow.toISOString().split('T')[0])
      .eq('status', 'in_progress');

    if (issuesError) throw issuesError;

    let emailsSent = 0;

    for (const issue of issues || []) {
      // Get pending items (not ready)
      const pendingItems = issue.lineup_items?.filter(
        item => !item.text_ready && !item.files_ready
      ) || [];

      if (pendingItems.length === 0) continue;

      // Group by responsible editor
      const editorMap = new Map<string, typeof pendingItems>();
      
      for (const item of pendingItems) {
        if (item.responsible_editor_id) {
          if (!editorMap.has(item.responsible_editor_id)) {
            editorMap.set(item.responsible_editor_id, []);
          }
          editorMap.get(item.responsible_editor_id)!.push(item);
        }
      }

      // Send email to each editor
      for (const [editorId, items] of editorMap) {
        // Get editor info
        const { data: editor } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', editorId)
          .single();

        if (!editor?.email) continue;

        const daysLeft = Math.ceil(
          (new Date(issue.sketch_close_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const html = deadlineReminderHtml({
          editorName: editor.full_name || 'עורך',
          issueName: `${issue.theme} #${issue.issue_number}`,
          contentItems: items.map(item => ({
            title: item.content,
            pages: `${item.page_start}-${item.page_end}`
          })),
          deadline: issue.sketch_close_date,
          daysLeft
        });

        // Send via Resend
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'תזכורות <reminders@arli.co.il>',
            to: editor.email,
            subject: daysLeft <= 1 
              ? `🚨 דחוף! ${issue.theme} - הדדליין היום!`
              : `⏰ תזכורת: ${issue.theme} - ${daysLeft} ימים לדדליין`,
            html
          })
        });

        if (res.ok) {
          emailsSent++;
          console.log(`Sent reminder to ${editor.email}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
