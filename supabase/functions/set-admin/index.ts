import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegram_id, secret_key } = await req.json();

    if (!telegram_id) {
      return new Response(
        JSON.stringify({ error: 'telegram_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple secret key validation (you should set this in Supabase secrets)
    const ADMIN_SECRET = Deno.env.get('ADMIN_SECRET_KEY') || 'your-super-secret-admin-key';
    
    if (secret_key !== ADMIN_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Invalid secret key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegram_id)
      .single();

    let userId: string;

    if (profileError && profileError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `telegram_${telegram_id}@lyceum1.local`,
        email_confirm: true,
        user_metadata: {
          telegram_id: telegram_id,
          first_name: 'Admin',
          last_name: '',
        },
      });

      if (authError) {
        throw authError;
      }

      // Create profile
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          telegram_id: telegram_id,
          first_name: 'Admin',
          last_name: '',
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      userId = newProfile.id;
    } else if (profileError) {
      throw profileError;
    } else {
      userId = profile.id;
    }

    // Check if admin role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (existingRole) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User already has admin role',
          user_id: userId,
          telegram_id: telegram_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
      });

    if (roleError) {
      throw roleError;
    }

    console.log(`Admin role assigned to Telegram ID: ${telegram_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin role assigned successfully',
        user_id: userId,
        telegram_id: telegram_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error setting admin:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
