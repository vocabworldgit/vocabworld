#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');

// Get Vercel token
const token = execSync('vercel whoami --token', { encoding: 'utf-8' }).trim();

const envVars = [
  { key: 'STRIPE_MONTHLY_PRICE_ID', value: 'price_1SHFl82Oy137Zaz10zDeDXqO' },
  { key: 'STRIPE_YEARLY_PRICE_ID', value: 'price_1SHFl82Oy137Zaz1yoaYbL6n' },
];

console.log('Setting Stripe price IDs in Vercel...\n');

envVars.forEach(({ key, value }) => {
  try {
    // Remove existing
    try {
      execSync(`vercel env rm ${key} production --yes`, { stdio: 'inherit' });
    } catch (e) {
      // Ignore if doesn't exist
    }

    // Add new - using printf to avoid newline issues
    const command = `printf "${value}" | vercel env add ${key} production`;
    execSync(command, { stdio: 'inherit', shell: 'bash' });
    
    console.log(`✅ Set ${key}`);
  } catch (error) {
    console.error(`❌ Failed to set ${key}:`, error.message);
  }
});

console.log('\n✅ Environment variables updated!');
console.log('Run: vercel --prod --yes');
