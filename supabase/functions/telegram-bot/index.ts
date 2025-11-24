import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
    };
    data: string;
    message: {
      chat: {
        id: number;
      };
      message_id: number;
    };
  };
}

async function sendMessage(chatId: number, text: string, keyboard?: any) {
  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  
  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  return response.json();
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || 'Готово!',
      }),
    }
  );
}

async function getRAGResponse(userId: string, question: string): Promise<string> {
  // Validate input length to prevent abuse
  if (question.length > 1000) {
    return 'Вопрос слишком длинный. Пожалуйста, задайте более короткий вопрос.';
  }

  // Get chat history
  const { data: history } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get knowledge base
  const { data: knowledge } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('is_active', true);

  const context = knowledge?.map(k => `${k.title}: ${k.content}`).join('\n\n') || '';
  const chatContext = history?.map(h => `Q: ${h.message}\nA: ${h.response}`).join('\n') || '';

  const systemPrompt = `Ты - помощник Лицея №1. Используй следующую информацию для ответа на вопросы:

${context}

История общения:
${chatContext}

Отвечай кратко, информативно и дружелюбно. Если информации нет в базе знаний, так и скажи.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return 'Превышен лимит запросов. Пожалуйста, попробуйте позже.';
      }
      if (response.status === 402) {
        return 'Сервис временно недоступен. Обратитесь к администратору.';
      }
      console.error('AI API error:', response.status);
      return 'Извините, не могу ответить на вопрос в данный момент.';
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    // Save to history
    await supabase.from('chat_history').insert({
      user_id: userId,
      message: question,
      response: answer,
    });

    return answer;
  } catch (error) {
    console.error('RAG error:', error);
    return 'Произошла ошибка при обработке запроса.';
  }
}

serve(async (req) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return new Response('TELEGRAM_BOT_TOKEN not set', { status: 500 });
    }

    const update: TelegramUpdate = await req.json();
    console.log('Update:', JSON.stringify(update));

    // Handle callback queries
    if (update.callback_query) {
      const { callback_query } = update;
      const chatId = callback_query.message.chat.id;
      const data = callback_query.data;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', callback_query.from.id)
        .single();

      if (!profile) {
        await answerCallbackQuery(callback_query.id, 'Ошибка: профиль не найден');
        return new Response('OK', { status: 200 });
      }

      if (data.startsWith('role_')) {
        const role = data.replace('role_', '');
        await supabase
          .from('profiles')
          .update({ selected_role: role })
          .eq('telegram_id', callback_query.from.id);

        await answerCallbackQuery(callback_query.id, 'Роль выбрана!');

        // Show categories
        const { data: categories } = await supabase
          .from('news_categories')
          .select('*');

        const keyboard = {
          inline_keyboard: categories?.map(cat => [{
            text: `${cat.icon || '📌'} ${cat.name}`,
            callback_data: `cat_${cat.id}`,
          }]) || [],
        };

        await sendMessage(
          chatId,
          '✅ Отлично! Теперь выберите интересующие вас категории новостей:',
          keyboard
        );
      } else if (data.startsWith('cat_')) {
        const categoryId = data.replace('cat_', '');
        
        // Toggle subscription
        const { data: existing } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', profile.id)
          .eq('category_id', categoryId)
          .single();

        if (existing) {
          await supabase
            .from('user_preferences')
            .delete()
            .eq('id', existing.id);
          await answerCallbackQuery(callback_query.id, 'Отписались от категории');
        } else {
          await supabase
            .from('user_preferences')
            .insert({
              user_id: profile.id,
              category_id: categoryId,
            });
          await answerCallbackQuery(callback_query.id, 'Подписались на категорию!');
        }
      } else if (data === 'complete_registration') {
        await supabase
          .from('profiles')
          .update({ registration_completed: true })
          .eq('telegram_id', callback_query.from.id);

        await answerCallbackQuery(callback_query.id);
        await sendMessage(
          chatId,
          '🎉 Регистрация завершена! Теперь вы можете открыть приложение и просматривать новости и мероприятия.\n\nИспользуйте /help для списка команд.'
        );
      }

      return new Response('OK', { status: 200 });
    }

    if (!update.message?.text) {
      return new Response('OK', { status: 200 });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text;

    // Check if user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('telegram_id', message.from.id)
      .single();

    // /start command
    if (text === '/start') {
      if (!profile) {
        await sendMessage(
          chatId,
          '👋 Добро пожаловать в Лицей №1!\n\nДля начала работы необходимо пройти регистрацию. Нажмите кнопку ниже, чтобы начать.',
          {
            inline_keyboard: [[
              { text: '📝 Начать регистрацию', callback_data: 'start_registration' }
            ]],
          }
        );
        return new Response('OK', { status: 200 });
      }

      if (!profile.registration_completed) {
        // Continue registration
        const keyboard = {
          inline_keyboard: [
            [{ text: '👨‍🎓 Ученик', callback_data: 'role_student' }],
            [{ text: '👨‍👩‍👧 Родитель', callback_data: 'role_parent' }],
          ],
        };

        await sendMessage(
          chatId,
          'Выберите вашу роль:',
          keyboard
        );
      } else {
        await sendMessage(
          chatId,
          `Привет, ${message.from.first_name}! 👋\n\nИспользуйте /webapp чтобы открыть приложение, или задайте мне вопрос о лицее.`
        );
      }

      return new Response('OK', { status: 200 });
    }

    // /help command
    if (text === '/help') {
      await sendMessage(
        chatId,
        `📚 <b>Доступные команды:</b>\n\n` +
        `/start - Начать работу с ботом\n` +
        `/webapp - Открыть приложение\n` +
        `/help - Показать это сообщение\n\n` +
        `Вы также можете задать мне любой вопрос о лицее, и я постараюсь помочь!`
      );
      return new Response('OK', { status: 200 });
    }

    // /webapp command
    if (text === '/webapp') {
      if (!profile || !profile.registration_completed) {
        await sendMessage(
          chatId,
          '⚠️ Для доступа к приложению необходимо завершить регистрацию. Используйте /start'
        );
        return new Response('OK', { status: 200 });
      }

      const webAppUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || ''}`;
      
      await sendMessage(
        chatId,
        `🚀 Открыть приложение:`,
        {
          inline_keyboard: [[
            { text: '📱 Открыть Mini App', web_app: { url: webAppUrl } }
          ]],
        }
      );
      return new Response('OK', { status: 200 });
    }

    // Handle questions (RAG)
    if (profile?.id && profile.registration_completed && text) {
      const answer = await getRAGResponse(profile.id, text);
      await sendMessage(chatId, answer);
    } else {
      await sendMessage(
        chatId,
        'Пожалуйста, завершите регистрацию с помощью команды /start'
      );
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Error', { status: 500 });
  }
});