import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the current user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "לא נמצא token אימות" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get current user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !currentUser) {
      return new Response(
        JSON.stringify({ error: "לא ניתן לאמת משתמש" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "לא ניתן לאמת הרשאות משתמש" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "רק מנהל מערכת יכול לשנות סיסמאות" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: "נא למלא אימייל וסיסמה חדשה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find user by email
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ error: "שגיאה בחיפוש משתמש" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetUser = users?.users?.find((u) => u.email === email);

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "משתמש לא נמצא" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user password
    const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
      targetUser.id,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message || "שגיאה בעדכון סיסמה" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "הסיסמה עודכנה בהצלחה",
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in update-user-password:", error);
    return new Response(
      JSON.stringify({ error: error.message || "שגיאה לא צפויה" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
