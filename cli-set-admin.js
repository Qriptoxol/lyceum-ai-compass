#!/usr/bin/env node

/**
 * CLI Script для назначения администратора в системе "Лицей №1"
 * 
 * Использование:
 *   node cli-set-admin.js <TELEGRAM_ID> [SECRET_KEY]
 * 
 * Пример:
 *   node cli-set-admin.js 123456789
 *   node cli-set-admin.js 123456789 my-custom-secret
 * 
 * Переменные окружения:
 *   SUPABASE_FUNCTIONS_URL - URL Edge Functions (по умолчанию из проекта)
 *   ADMIN_SECRET_KEY - секретный ключ для авторизации (обязательно!)
 */

const SUPABASE_FUNCTIONS_URL = process.env.SUPABASE_FUNCTIONS_URL || 'https://yffdyyjugrzyqdvtjnho.supabase.co/functions/v1';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

async function setAdmin(telegramId, secretKey) {
  if (!telegramId) {
    console.error('❌ Ошибка: Telegram ID не указан');
    console.log('\nИспользование:');
    console.log('  node cli-set-admin.js <TELEGRAM_ID> [SECRET_KEY]');
    console.log('\nПример:');
    console.log('  node cli-set-admin.js 123456789');
    console.log('\nКак узнать свой Telegram ID:');
    console.log('  1. Напишите боту @userinfobot в Telegram');
    console.log('  2. Скопируйте значение "Id"');
    process.exit(1);
  }

  if (!secretKey && !ADMIN_SECRET_KEY) {
    console.error('❌ Ошибка: ADMIN_SECRET_KEY не установлен');
    console.log('\nУстановите секретный ключ одним из способов:');
    console.log('  1. Передайте как аргумент: node cli-set-admin.js 123456789 your-secret');
    console.log('  2. Установите переменную окружения: export ADMIN_SECRET_KEY=your-secret');
    console.log('\nСгенерировать случайный ключ:');
    console.log('  openssl rand -hex 32');
    process.exit(1);
  }

  const finalSecretKey = secretKey || ADMIN_SECRET_KEY;
  const parsedTelegramId = parseInt(telegramId);

  if (isNaN(parsedTelegramId)) {
    console.error('❌ Ошибка: Telegram ID должен быть числом');
    process.exit(1);
  }

  console.log('🚀 Назначение администратора...');
  console.log(`   Telegram ID: ${parsedTelegramId}`);
  console.log(`   Supabase URL: ${SUPABASE_FUNCTIONS_URL}`);

  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/set-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: parsedTelegramId,
        secret_key: finalSecretKey,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ Ошибка: ${result.error || 'Неизвестная ошибка'}`);
      if (response.status === 403) {
        console.log('\n💡 Убедитесь, что ADMIN_SECRET_KEY совпадает с тем, что установлен в Supabase Secrets');
      }
      process.exit(1);
    }

    console.log('✅ Успешно!');
    console.log(`   User ID: ${result.user_id}`);
    console.log(`   Сообщение: ${result.message}`);
    console.log('\n🎉 Администратор назначен!');
    console.log('   Теперь пользователь может войти в систему через Telegram Mini App');
  } catch (error) {
    console.error('❌ Ошибка сети:', error.message);
    console.log('\n💡 Проверьте:');
    console.log('  1. Доступность интернета');
    console.log('  2. Правильность SUPABASE_FUNCTIONS_URL');
    console.log('  3. Edge Function set-admin развернута');
    process.exit(1);
  }
}

// Запуск скрипта
const telegramId = process.argv[2];
const secretKey = process.argv[3];

setAdmin(telegramId, secretKey);
