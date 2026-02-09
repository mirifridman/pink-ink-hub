import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the requester is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'לא מורשה - נדרשת הזדהות' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's token to verify they're an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !currentUser) {
      console.error('Failed to get current user:', userError);
      return new Response(
        JSON.stringify({ error: 'לא מורשה - משתמש לא מזוהה' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the current user is an admin
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to get user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'לא ניתן לאמת הרשאות משתמש' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.role !== 'admin') {
      console.error('User is not an admin:', currentUser.id, 'role:', profile.role);
      return new Response(
        JSON.stringify({ error: 'רק מנהל מערכת יכול ליצור משתמשים' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { email, password, fullName, role } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'נא למלא אימייל וסיסמה' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Creating user:', email);

    // Create the user using the admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since admin is creating
      user_metadata: {
        full_name: fullName || '',
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      
      // Translate common errors
      const errorMessages: Record<string, string> = {
        'A user with this email address has already been registered': 'משתמש עם אימייל זה כבר קיים',
        'User already registered': 'משתמש עם אימייל זה כבר קיים',
      };
      
      const translatedError = errorMessages[createError.message] || createError.message;
      
      return new Response(
        JSON.stringify({ error: translatedError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newUser.user) {
      console.log('User created successfully:', newUser.user.id);
      
      // Update the role in profiles table
      const { error: profileUpdateError } = await adminClient
        .from('profiles')
        .update({ 
          role: role || 'viewer',
          full_name: fullName || ''
        })
        .eq('id', newUser.user.id);

      if (profileUpdateError) {
        console.error('Error updating profile role:', profileUpdateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: newUser.user,
        message: 'המשתמש נוצר בהצלחה' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'שגיאה בלתי צפויה' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
