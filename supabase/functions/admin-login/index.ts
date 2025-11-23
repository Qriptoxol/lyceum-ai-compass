import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get admin user
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return new Response(
        JSON.stringify({ error: 'Неверный логин или пароль' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Неверный логин или пароль' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Generate session token (simple JWT alternative)
    const sessionToken = btoa(JSON.stringify({
      id: admin.id,
      username: admin.username,
      exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    }));

    return new Response(
      JSON.stringify({
        success: true,
        token: sessionToken,
        admin: {
          id: admin.id,
          username: admin.username,
          full_name: admin.full_name,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});