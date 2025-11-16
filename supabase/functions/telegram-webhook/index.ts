import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const update: TelegramUpdate = await req.json();
    console.log('Received update:', JSON.stringify(update));

    if (!update.message || !update.message.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { from, chat, text } = update.message;
    const telegramId = from.id;

    // Check if user exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('telegram_id', telegramId)
      .single();

    let responseText = '';

    if (!profile) {
      responseText = `👋 Добро пожаловать в Лицей №1!\n\nДля начала работы зарегистрируйтесь в системе через наше веб-приложение.`;
    } else {
      const roles = profile.user_roles?.map((r: any) => r.role) || [];
      
      if (text === '/start') {
        responseText = `Привет, ${from.first_name}! 👋\n\nВаши роли: ${roles.join(', ')}\n\nИспользуйте команды:\n/help - список команд\n/webapp - открыть приложение`;
      } else if (text === '/help') {
        responseText = `📚 Доступные команды:\n\n/start - начать работу\n/webapp - открыть веб-приложение\n/schedule - расписание\n/courses - спецкурсы\n/profile - мой профиль`;
      } else if (text === '/webapp') {
        const webAppUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/verify-init-data`;
        responseText = `🌐 Откройте веб-приложение:\n${webAppUrl}`;
      } else {
        responseText = `Команда не распознана. Используйте /help для списка команд.`;
      }
    }

    // Send response to Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat.id,
        text: responseText,
        parse_mode: 'Markdown',
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
