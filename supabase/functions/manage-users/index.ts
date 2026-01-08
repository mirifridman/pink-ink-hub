import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only admins can manage users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, email, fullName, role, password, invitationId } = await req.json();

    if (action === "create") {
      if (!email || !role) {
        return new Response(JSON.stringify({ error: "Email and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create user with admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || Math.random().toString(36).slice(-12) + "A1!",
        email_confirm: true,
        user_metadata: { full_name: fullName || "" },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role });

      if (roleError) {
        // Rollback: delete the created user
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, user: { id: newUser.user.id, email } }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "invite") {
      if (!email || !role) {
        return new Response(JSON.stringify({ error: "Email and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === email);
      
      if (userExists) {
        return new Response(JSON.stringify({ error: "משתמש עם אימייל זה כבר קיים במערכת" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create invitation record
      const { data: invitation, error: inviteError } = await supabaseAdmin
        .from("user_invitations")
        .insert({
          email,
          full_name: fullName || null,
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) {
        if (inviteError.code === "23505") {
          return new Response(JSON.stringify({ error: "כבר נשלחה הזמנה לאימייל זה" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Send magic link invitation
      const { error: magicLinkError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName || "", invitation_id: invitation.id },
      });

      if (magicLinkError) {
        // Remove the invitation if magic link fails
        await supabaseAdmin.from("user_invitations").delete().eq("id", invitation.id);
        return new Response(JSON.stringify({ error: magicLinkError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, invitation }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_invitation_link") {
      if (!email || !role) {
        return new Response(JSON.stringify({ error: "Email and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === email);
      
      if (userExists) {
        return new Response(JSON.stringify({ error: "משתמש עם אימייל זה כבר קיים במערכת" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for existing invitation
      const { data: existingInvitation } = await supabaseAdmin
        .from("user_invitations")
        .select("*")
        .eq("email", email)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvitation) {
        return new Response(JSON.stringify({ 
          success: true, 
          token: existingInvitation.id,
          invitation: existingInvitation,
          message: "Using existing invitation"
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create invitation record
      const { data: invitation, error: inviteError } = await supabaseAdmin
        .from("user_invitations")
        .insert({
          email,
          full_name: fullName || null,
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) {
        console.error("Error creating invitation:", inviteError);
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Created invitation:", invitation.id);

      return new Response(JSON.stringify({ 
        success: true, 
        token: invitation.id,
        invitation 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancel_invitation") {
      if (!invitationId) {
        return new Response(JSON.stringify({ error: "Invitation ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from("user_invitations")
        .delete()
        .eq("id", invitationId);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "resend_invitation") {
      if (!invitationId) {
        return new Response(JSON.stringify({ error: "Invitation ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get invitation details
      const { data: invitation, error: getError } = await supabaseAdmin
        .from("user_invitations")
        .select("*")
        .eq("id", invitationId)
        .single();

      if (getError || !invitation) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update expiration
      await supabaseAdmin
        .from("user_invitations")
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "pending"
        })
        .eq("id", invitationId);

      // Resend magic link
      const { error: magicLinkError } = await supabaseAdmin.auth.admin.inviteUserByEmail(invitation.email, {
        data: { full_name: invitation.full_name || "", invitation_id: invitation.id },
      });

      if (magicLinkError) {
        return new Response(JSON.stringify({ error: magicLinkError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "process_invitation") {
      const { userId, invitationId: processInvitationId } = await req.json();
      
      if (!userId || !processInvitationId) {
        return new Response(JSON.stringify({ error: "User ID and Invitation ID are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get invitation details
      const { data: invitation, error: getError } = await supabaseAdmin
        .from("user_invitations")
        .select("*")
        .eq("id", processInvitationId)
        .single();

      if (getError || !invitation) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign the role from the invitation
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ 
          user_id: userId, 
          role: invitation.role 
        }, { 
          onConflict: "user_id" 
        });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark invitation as used
      await supabaseAdmin
        .from("user_invitations")
        .update({ status: "accepted" })
        .eq("id", processInvitationId);

      console.log("Processed invitation for user:", userId, "with role:", invitation.role);

      return new Response(JSON.stringify({ success: true, role: invitation.role }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      const { userId, newPassword } = await req.json();
      
      if (!userId || !newPassword) {
        return new Response(JSON.stringify({ error: "User ID and new password are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update user password using admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Password reset for user:", userId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
