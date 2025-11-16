import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Telegram WebApp initData signature
async function verifyTelegramWebAppData(initData: string, botToken: string): Promise<any> {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  // Sort params alphabetically
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Create secret key from bot token
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const tokenHash = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(botToken)
  );

  // Verify hash
  const dataKey = await crypto.subtle.importKey(
    'raw',
    tokenHash,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const calculatedHash = await crypto.subtle.sign(
    'HMAC',
    dataKey,
    encoder.encode(dataCheckString)
  );

  const calculatedHashHex = Array.from(new Uint8Array(calculatedHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (calculatedHashHex !== hash) {
    throw new Error('Invalid hash');
  }

  // Parse user data
  const userParam = urlParams.get('user');
  if (!userParam) {
    throw new Error('User data not found');
  }

  return JSON.parse(userParam);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();

    if (!initData) {
      return new Response(
        JSON.stringify({ error: 'initData is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    // Verify initData signature
    const userData = await verifyTelegramWebAppData(initData, botToken);
    console.log('Verified user:', userData);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('telegram_id', userData.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    let userProfile = profile;

    // If user doesn't exist, create them
    if (!profile) {
      // First, create auth user with a random password
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `telegram_${userData.id}@lyceum1.local`,
        email_confirm: true,
        user_metadata: {
          telegram_id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name || '',
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
          telegram_id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name || '',
        })
        .select('*, user_roles(role)')
        .single();

      if (insertError) {
        throw insertError;
      }

      userProfile = newProfile;
    }

    // Generate session token
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `telegram_${userData.id}@lyceum1.local`,
    });

    if (sessionError) {
      throw sessionError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: userProfile,
        roles: userProfile.user_roles?.map((r: any) => r.role) || [],
        sessionUrl: sessionData.properties.action_link,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error verifying initData:', error);
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
