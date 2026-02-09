import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push library for Deno
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidKeys: { publicKey: string; privateKey: string }
) {
  const encoder = new TextEncoder();
  
  // Import crypto functions
  const { default: webpush } = await import("https://esm.sh/web-push@3.6.7");
  
  webpush.setVapidDetails(
    'mailto:admin@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys
    },
    payload
  );
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { userIds, title, body: notificationBody, url, tag } = body;

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get subscriptions for specified users or all users
    let query = supabase.from('push_subscriptions').select('*');
    
    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push to ${subscriptions.length} subscriptions`);

    const payload = JSON.stringify({
      title,
      body: notificationBody,
      url: url || '/',
      tag: tag || 'notification'
    });

    // Import web-push
    const { default: webpush } = await import("https://esm.sh/web-push@3.6.7");
    
    webpush.setVapidDetails(
      'mailto:admin@mata-mem.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    let successCount = 0;
    let failCount = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        );
        successCount++;
        console.log(`Push sent successfully to user ${sub.user_id}`);
      } catch (error: any) {
        console.error(`Failed to send push to ${sub.endpoint}:`, error.message);
        failCount++;
        
        // If subscription is expired or invalid, remove it
        if (error.statusCode === 404 || error.statusCode === 410) {
          failedEndpoints.push(sub.endpoint);
        }
      }
    }

    // Clean up invalid subscriptions
    if (failedEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', failedEndpoints);
      console.log(`Cleaned up ${failedEndpoints.length} invalid subscriptions`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications sent',
        sent: successCount,
        failed: failCount,
        cleaned: failedEndpoints.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send push notifications' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
