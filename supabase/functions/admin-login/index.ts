import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Simple rate limiting store (in production use Redis or similar)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  LOCKOUT_MS: 30 * 60 * 1000, // 30 minutes after max attempts
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    // Input validation
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Имя пользователя и пароль обязательны' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (username.length > 100 || password.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Неверные учетные данные' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check
    const now = Date.now();
    const attempts = loginAttempts.get(username);
    
    if (attempts) {
      if (attempts.count >= RATE_LIMIT.MAX_ATTEMPTS) {
        const timeSinceLastAttempt = now - attempts.lastAttempt;
        if (timeSinceLastAttempt < RATE_LIMIT.LOCKOUT_MS) {
          const remainingMinutes = Math.ceil((RATE_LIMIT.LOCKOUT_MS - timeSinceLastAttempt) / 60000);
          return new Response(
            JSON.stringify({ 
              error: `Слишком много попыток входа. Попробуйте снова через ${remainingMinutes} минут.` 
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Reset after lockout period
          loginAttempts.delete(username);
        }
      }
    }

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
      // Increment failed attempts
      const currentAttempts = loginAttempts.get(username) || { count: 0, lastAttempt: now };
      loginAttempts.set(username, {
        count: currentAttempts.count + 1,
        lastAttempt: now,
      });

      return new Response(
        JSON.stringify({ error: 'Неверный логин или пароль' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      // Increment failed attempts
      const currentAttempts = loginAttempts.get(username) || { count: 0, lastAttempt: now };
      loginAttempts.set(username, {
        count: currentAttempts.count + 1,
        lastAttempt: now,
      });

      return new Response(
        JSON.stringify({ error: 'Неверный логин или пароль' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(username);

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
