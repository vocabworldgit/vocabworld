import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Universal Audio API - B2 Authenticated Access
// Fetches audio from private B2 bucket using API credentials
export async function GET(request: NextRequest) {
  try {
    console.log('🔑 Universal Audio API (B2 Authenticated) called'); 
    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get('wordId');
    const languageCode = searchParams.get('languageCode');

    console.log(`🔑 Authenticated Audio Request:`, { wordId, languageCode });

    if (!wordId || !languageCode) {
      return NextResponse.json(
        { error: 'Missing required parameters: wordId and languageCode' },
        { status: 400 }
      );
    }

    // B2 credentials from environment
    const keyId = process.env.B2_APPLICATION_KEY_ID;
    const applicationKey = process.env.B2_APPLICATION_KEY;

    if (!keyId || !applicationKey) {
      console.log('❌ B2 credentials not found in environment');
      return NextResponse.json(
        { error: 'B2 credentials not configured' },
        { status: 503 }
      );
    }

    // Language code mapping
    const getAudioLanguageCode = (langCode: string): string => {
      const languageMap: { [key: string]: string } = {
        'Arabic': 'ar', 'Bulgarian': 'bg', 'Bengali': 'bn', 'Catalan': 'ca',
        'Czech': 'cs', 'Welsh': 'cy', 'Danish': 'da', 'German': 'de',
        'Greek': 'el', 'English': 'en', 'Spanish': 'es', 'Estonian': 'et',
        'Basque': 'eu', 'Persian': 'fa', 'Finnish': 'fi', 'French': 'fr',
        'Irish': 'ga', 'Gujarati': 'gu', 'Hebrew': 'he', 'Hindi': 'hi',
        'Croatian': 'hr', 'Hungarian': 'hu', 'Indonesian': 'id', 'Icelandic': 'is',
        'Italian': 'it', 'Japanese': 'ja', 'Korean': 'ko', 'Lithuanian': 'lt',
        'Latvian': 'lv', 'Macedonian': 'mk', 'Malayalam': 'ml', 'Marathi': 'mr',
        'Maltese': 'mt', 'Dutch': 'nl', 'Norwegian': 'no', 'Polish': 'pl',
        'Portuguese': 'pt', 'Romanian': 'ro', 'Russian': 'ru', 'Slovak': 'sk',
        'Slovenian': 'sl', 'Swedish': 'sv', 'Tamil': 'ta', 'Telugu': 'te',
        'Thai': 'th', 'Turkish': 'tr', 'Ukrainian': 'uk', 'Urdu': 'ur',
        'Vietnamese': 'vi', 'Chinese': 'zh',
        'el-GR': 'el', 'en-US': 'en', 'es-ES': 'es', 'fr-FR': 'fr',
        'de-DE': 'de', 'it-IT': 'it', 'pt-PT': 'pt', 'ru-RU': 'ru',
        'ja-JP': 'ja', 'ko-KR': 'ko', 'zh-CN': 'zh', 'ar-SA': 'ar'
      };
      return languageMap[langCode] || languageMap[langCode.toLowerCase()] || langCode.split('-')[0].toLowerCase();
    };

    const audioLangCode = getAudioLanguageCode(languageCode);
    console.log(`🔑 Language mapping:`, { original: languageCode, mapped: audioLangCode });

    // Step 1: Authorize with B2
    console.log('🔐 Authorizing with B2...');
    
    const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${applicationKey}`).toString('base64')
      }
    });

    if (!authResponse.ok) {
      console.log('❌ B2 authorization failed');
      return NextResponse.json(
        { error: 'B2 authorization failed' },
        { status: 503 }
      );
    }

    const authData = await authResponse.json();
    console.log('✅ B2 authorization successful');

    // Step 2: Get download authorization
    console.log('🔑 Getting download authorization...');
    
    const downloadAuthResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_download_authorization`, {
      method: 'POST',
      headers: {
        'Authorization': authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: 'aa1d47dd5cca310593920d1c',
        fileNamePrefix: `${audioLangCode}/`,
        validDurationInSeconds: 3600
      })
    });

    if (!downloadAuthResponse.ok) {
      console.log('❌ Download authorization failed');
      return NextResponse.json(
        { error: 'Download authorization failed' },
        { status: 503 }
      );
    }

    const downloadAuthData = await downloadAuthResponse.json();
    console.log('✅ Download authorization successful');

    // Step 3: Find file URL from CSV (but use correct domain)
    const csvPath = path.join(process.cwd(), 'backblaze-urls-20250909-180354.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log(`❌ CSV file not found: ${csvPath}`);
      return NextResponse.json(
        { error: 'Audio mapping not available' },
        { status: 503 }
      );
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    let fileName: string | null = null;
    let filePath: string | null = null;
    
    console.log(`🔍 Searching ${lines.length} entries for wordId=${wordId}, language=${audioLangCode}`);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const match = line.match(/^"([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)"$/);
      if (!match) continue;

      const [, localPath, backblazeURL, language, category, csvFileName] = match;
      
      const wordIdMatch = csvFileName.match(/alnilam_(\d+)_/);
      if (!wordIdMatch) continue;

      const csvWordId = wordIdMatch[1];
      
      if (csvWordId === wordId && language === audioLangCode) {
        fileName = csvFileName;
        filePath = localPath;
        console.log(`✅ Found audio mapping: ${fileName} at ${filePath}`);
        break;
      }
    }

    if (!fileName || !filePath) {
      console.log(`❌ Audio file not found in CSV for wordId=${wordId}, language=${audioLangCode}`);
      return NextResponse.json(
        { error: 'Audio file not found', wordId, languageCode: audioLangCode },
        { status: 404 }
      );
    }

    // Step 4: Download file using authenticated URL
    const authenticatedUrl = `${authData.downloadUrl}/file/voco-audio-library/${filePath}`;
    console.log(`🌐 Fetching authenticated audio: ${authenticatedUrl}`);
    
    const audioResponse = await fetch(authenticatedUrl, {
      headers: {
        'Authorization': downloadAuthData.authorizationToken
      }
    });

    if (!audioResponse.ok) {
      console.error(`❌ Authenticated download failed: ${audioResponse.status} ${audioResponse.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch audio from B2', status: audioResponse.status },
        { status: 502 }
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    console.log(`🔑 Serving authenticated audio: ${fileName} (${audioBuffer.byteLength} bytes)`);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Access-Control-Allow-Origin': '*',
        'X-Audio-Source': 'b2-authenticated',
        'X-Audio-Auth': 'private-bucket',
      },
    });

  } catch (error) {
    console.error('❌ Authenticated Audio API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}