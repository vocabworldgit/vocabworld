import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Universal Audio API - Cloud Version (Backblaze B2)
// Serves Alnilam multilingual audio files from cloud storage
export async function GET(request: NextRequest) {
  try {
    console.log('🌤️ Universal Audio API (Cloud) called'); 
    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get('wordId');
    const languageCode = searchParams.get('languageCode');

    console.log(`🌤️ Cloud Audio Request:`, { wordId, languageCode });

    if (!wordId || !languageCode) {
      return NextResponse.json(
        { error: 'Missing required parameters: wordId and languageCode' },
        { status: 400 }
      );
    }

    // Language code mapping to handle locale variants and full names
    const getAudioLanguageCode = (langCode: string): string => {
      // Handle full language names and locale variants
      const languageMap: { [key: string]: string } = {
        // Full language names to codes (COMPLETE MAPPING)
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
        
        // Alternative language names
        'irish': 'ga', 'gaelic': 'ga', 'irish gaelic': 'ga',
        'macedonian': 'mk', 'lithuanian': 'lt', 'icelandic': 'is',
        'latvian': 'lv', 'estonian': 'et', 'slovenian': 'sl',
        'catalan': 'ca', 'welsh': 'cy', 'basque': 'eu',
        'persian': 'fa', 'farsi': 'fa', 'gujarati': 'gu',
        'malayalam': 'ml', 'urdu': 'ur',
        
        // Locale variants to base codes  
        'el-GR': 'el', 'en-US': 'en', 'es-ES': 'es', 'fr-FR': 'fr',
        'de-DE': 'de', 'it-IT': 'it', 'pt-PT': 'pt', 'ru-RU': 'ru',
        'ja-JP': 'ja', 'ko-KR': 'ko', 'zh-CN': 'zh', 'ar-SA': 'ar',
        'hi-IN': 'hi', 'tr-TR': 'tr', 'pl-PL': 'pl', 'nl-NL': 'nl',
        'sv-SE': 'sv', 'nb-NO': 'no', 'da-DK': 'da', 'fi-FI': 'fi',
        'cs-CZ': 'cs', 'sk-SK': 'sk', 'hu-HU': 'hu', 'ro-RO': 'ro',
        'bg-BG': 'bg', 'hr-HR': 'hr', 'sl-SI': 'sl', 'et-EE': 'et',
        'lv-LV': 'lv', 'lt-LT': 'lt', 'mt-MT': 'mt', 'he-IL': 'he',
        'is-IS': 'is', 'mk-MK': 'mk', 'ga-IE': 'ga', 'cy-GB': 'cy',
        'ca-ES': 'ca', 'eu-ES': 'eu', 'fa-IR': 'fa', 'gu-IN': 'gu',
        'ml-IN': 'ml', 'mr-IN': 'mr', 'ta-IN': 'ta', 'te-IN': 'te',
        'bn-BD': 'bn', 'ur-PK': 'ur', 'vi-VN': 'vi', 'th-TH': 'th',
        'uk-UA': 'uk', 'id-ID': 'id'
      };

      return languageMap[langCode] || languageMap[langCode.toLowerCase()] || langCode.split('-')[0].toLowerCase();
    };

    const audioLangCode = getAudioLanguageCode(languageCode);
    console.log(`🌤️ Language mapping:`, { original: languageCode, mapped: audioLangCode });

    // Load CSV and find the audio file
    console.log('🔍 Loading CSV mapping...');
    
    const csvPath = path.join(process.cwd(), 'backblaze-urls-20250909-180354.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log(`❌ CSV file not found: ${csvPath}`);
      return NextResponse.json(
        { error: 'Audio mapping not available' },
        { status: 503 }
      );
    }

    // Read and parse CSV to find the exact audio file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    let audioUrl: string | null = null;
    let fileName: string | null = null;
    
    console.log(`🔍 Searching ${lines.length} entries for wordId=${wordId}, language=${audioLangCode}`);

    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i];
      if (!line.trim()) continue;

      const match = line.match(/^"([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)"$/);
      if (!match) continue;

      const [, localPath, backblazeURL, language, category, csvFileName] = match;
      
      // Extract wordId from filename
      const wordIdMatch = csvFileName.match(/alnilam_(\d+)_/);
      if (!wordIdMatch) continue;

      const csvWordId = wordIdMatch[1];
      
      // Check if this matches our request
      if (csvWordId === wordId && language === audioLangCode) {
        audioUrl = backblazeURL;
        fileName = csvFileName;
        console.log(`✅ Found B2 audio: ${fileName} at ${audioUrl}`);
        break;
      }
    }

    if (!audioUrl || !fileName) {
      console.log(`❌ Audio file not found in CSV for wordId=${wordId}, language=${audioLangCode}`);
      return NextResponse.json(
        { error: 'Audio file not found', wordId, languageCode: audioLangCode },
        { status: 404 }
      );
    }

    // Fetch audio from B2
    console.log(`🌐 Fetching audio from B2: ${audioUrl}`);
    
    try {
      const response = await fetch(audioUrl);
      
      if (!response.ok) {
        console.error(`❌ B2 fetch failed: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: 'Failed to fetch audio from cloud storage', status: response.status },
          { status: 502 }
        );
      }

      const audioBuffer = await response.arrayBuffer();
      console.log(`🌤️ Serving cloud audio: ${fileName} (${audioBuffer.byteLength} bytes)`);

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
          'Content-Disposition': `inline; filename="${fileName}"`,
          'Access-Control-Allow-Origin': '*',
          'X-Audio-Source': 'backblaze-b2',
          'X-Audio-Cache': 'cloud-storage',
        },
      });

    } catch (fetchError) {
      console.error('❌ B2 Fetch Error:', fetchError);
      return NextResponse.json(
        { error: 'Cloud storage fetch error', details: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('❌ Universal Audio API (Cloud) Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}