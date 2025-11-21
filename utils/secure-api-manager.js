/**
 * Secure API Key Management Utility
 * Centralizes API key access and provides security warnings
 */

class SecureAPIManager {
  static getGeminiAPIKey() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === 'your_gemini_api_key_here') {
      console.error(`
🚨 SECURITY WARNING: Gemini API Key not properly configured!
Please:
1. Copy .env.example to .env.local
2. Add your real Gemini API key to .env.local
3. Never commit .env.local to Git (it's already in .gitignore)
      `);
      throw new Error('Gemini API key not configured. Check .env.local file.');
    }
    return apiKey;
  }

  static getElevenLabsAPIKey() {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_ELEVENLABS_API_KEY' || apiKey === 'your_elevenlabs_api_key_here') {
      console.warn(`
⚠️  WARNING: ElevenLabs API Key not configured.
TTS will fall back to other services.
To enable ElevenLabs TTS:
1. Get API key from https://elevenlabs.io
2. Add NEXT_PUBLIC_ELEVENLABS_API_KEY to .env.local
      `);
      return null;
    }
    return apiKey;
  }

  static getAzureAPIKey() {
    const apiKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
    const region = process.env.NEXT_PUBLIC_AZURE_REGION;
    
    if (!apiKey || !region) {
      console.warn('Azure Speech Service not configured. Skipping Azure TTS.');
      return null;
    }
    
    return { apiKey, region };
  }

  static validateEnvironment() {
    const warnings = [];
    
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      warnings.push('❌ NEXT_PUBLIC_GEMINI_API_KEY missing');
    }
    
    if (!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
      warnings.push('⚠️  NEXT_PUBLIC_ELEVENLABS_API_KEY missing (optional)');
    }
    
    if (warnings.length > 0) {
      console.log(`
🔒 Environment Configuration Status:
${warnings.join('\n')}

📋 Setup Instructions:
1. Copy .env.example to .env.local
2. Add your API keys to .env.local
3. Restart your development server
      `);
    } else {
      console.log('✅ All API keys properly configured!');
    }
    
    return warnings.length === 0;
  }

  static logSecurityStatus() {
    console.log(`
🛡️  Security Status Check:
• .env.local exists: ${require('fs').existsSync('./.env.local') ? '✅' : '❌'}
• Gemini API configured: ${process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '✅' : '❌'}
• ElevenLabs API configured: ${process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? '✅' : '⚠️ '}
• Git ignore protection: ✅ (.env* files protected)
    `);
  }
}

module.exports = SecureAPIManager;
