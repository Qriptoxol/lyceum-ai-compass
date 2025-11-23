#!/usr/bin/env node

/**
 * CLI Script to create admin users
 * 
 * Usage:
 *   node cli-create-admin.js <username> <password> <full_name>
 * 
 * Example:
 *   node cli-create-admin.js admin MySecurePass123 "Главный администратор"
 */

const https = require('https');

// Configuration
const SUPABASE_PROJECT_ID = 'yffdyyjugrzyqdvtjnho';
const FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/create-admin`;

// Get arguments
const [,, username, password, fullName] = process.argv;

if (!username || !password) {
  console.error('❌ Usage: node cli-create-admin.js <username> <password> [full_name]');
  console.error('   Example: node cli-create-admin.js admin MyPass123 "Admin Name"');
  process.exit(1);
}

// Prompt for secret key
console.log('\n🔐 Creating admin user...');
console.log(`Username: ${username}`);
console.log(`Full Name: ${fullName || 'N/A'}\n`);

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Enter ADMIN_SECRET_KEY: ', (secretKey) => {
  readline.close();

  if (!secretKey) {
    console.error('❌ ADMIN_SECRET_KEY is required');
    process.exit(1);
  }

  // Prepare request data
  const data = JSON.stringify({
    username,
    password,
    full_name: fullName || username,
    secret_key: secretKey
  });

  // Make HTTPS request
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('\n📡 Sending request...\n');

  const req = https.request(FUNCTION_URL, options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(responseData);

        if (res.statusCode === 200 && response.success) {
          console.log('✅ Admin user created successfully!');
          console.log(`   Admin ID: ${response.admin.id}`);
          console.log(`   Username: ${response.admin.username}`);
          console.log('\n🎉 You can now login at: /admin/login\n');
        } else {
          console.error('❌ Error creating admin:');
          console.error(`   ${response.error || 'Unknown error'}\n`);
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Failed to parse response:', responseData);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    process.exit(1);
  });

  req.write(data);
  req.end();
});