#!/usr/bin/env node

/**
 * CLI утилита для создания первого администратора ВЕБ-АДМИН-ПАНЕЛИ
 * 
 * ВАЖНО: Этот скрипт создает учетную запись для входа в веб-админ-панель (/admin/login).
 * Для назначения роли admin существующему пользователю Telegram используйте cli-set-admin.js
 * 
 * Использование: node cli-create-first-admin.js <username> <password> [full_name]
 * Пример: node cli-create-first-admin.js admin SecurePass123! "Администратор"
 */

const https = require('https');
const readline = require('readline');

// Замените на ваш project_id из supabase/config.toml
const PROJECT_ID = 'yffdyyjugrzyqdvtjnho';
const FUNCTION_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/create-admin`;

// Парсинг аргументов
const args = process.argv.slice(2);
const username = args[0];
const password = args[1];
const full_name = args[2] || username;

if (!username || !password) {
  console.error('Ошибка: Укажите имя пользователя и пароль');
  console.log('Использование: node cli-create-first-admin.js <username> <password> [full_name]');
  console.log('Пример: node cli-create-first-admin.js admin SecurePass123! "Администратор"');
  process.exit(1);
}

// Запрос секретного ключа
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Введите ADMIN_SECRET_KEY: ', (secret_key) => {
  rl.close();

  if (!secret_key) {
    console.error('Ошибка: Секретный ключ обязателен');
    process.exit(1);
  }

  console.log('\nСоздание администратора...');
  console.log(`Username: ${username}`);
  console.log(`Full name: ${full_name}\n`);

  const payload = JSON.stringify({
    username,
    password,
    full_name,
    secret_key
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(FUNCTION_URL, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200 && response.success) {
          console.log('✅ Администратор успешно создан!');
          console.log(`ID: ${response.admin.id}`);
          console.log(`Username: ${response.admin.username}`);
          console.log('\nТеперь вы можете войти в админ-панель:');
          console.log('URL: /admin/login');
        } else {
          console.error('❌ Ошибка создания администратора:');
          console.error(response.error || data);
          process.exit(1);
        }
      } catch (e) {
        console.error('❌ Ошибка парсинга ответа:', e.message);
        console.error('Response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Ошибка сети:', error.message);
    process.exit(1);
  });

  req.write(payload);
  req.end();
});
