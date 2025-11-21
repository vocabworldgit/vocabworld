import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Alnilam Audio API - Enhanced version with complete language support
export async function GET(request: NextRequest) {
  try {
    console.log('🎵 Alnilam Audio API called');
    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get('wordId');
    const languageCode = searchParams.get('languageCode');
    const topicName = searchParams.get('topicName');

    console.log(`🎵 Alnilam Audio Request:`, { wordId, languageCode, topicName });

    if (!wordId || !languageCode) {
      return NextResponse.json(
        { error: 'Missing required parameters: wordId and languageCode' },
        { status: 400 }
      );
    }

    // Complete language code mapping
    const getAudioLanguageCode = (langCode: string): string => {
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
        
        // Alternative language names (case-insensitive)
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
    console.log(`🎵 Language mapping:`, { original: languageCode, mapped: audioLangCode });

    // Path to language directory in Alnilam library
    const languageDir = path.join(process.cwd(), 'public', 'alnilam-audio-library', audioLangCode);
    
    if (!fs.existsSync(languageDir)) {
      console.log(`❌ Language directory not found: ${languageDir}`);
      return NextResponse.json(
        { error: 'Language not supported', languageCode: audioLangCode },
        { status: 404 }
      );
    }

    // Search for the audio file in specified topic or all topics
    let audioFilePath: string | null = null;
    let foundFileName: string | null = null;
    let searchDirs: string[] = [];

    if (topicName) {
      // Search in specific topic
      const topicPath = path.join(languageDir, topicName);
      if (fs.existsSync(topicPath)) {
        searchDirs = [topicName];
      }
    } else {
      // Search in all topic directories
      searchDirs = fs.readdirSync(languageDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    }

    console.log(`🔍 Searching in ${searchDirs.length} topic directories for wordId ${wordId}`);

    for (const topicDir of searchDirs) {
      const topicPath = path.join(languageDir, topicDir);
      
      try {
        const files = fs.readdirSync(topicPath);
        
        // Look for files matching pattern: alnilam_{wordId}_*.wav
        const matchingFile = files.find(file => 
          file.startsWith(`alnilam_${wordId}_`) && file.endsWith('.wav')
        );

        if (matchingFile) {
          audioFilePath = path.join(topicPath, matchingFile);
          foundFileName = matchingFile;
          console.log(`✅ Found audio file: ${foundFileName} in topic: ${topicDir}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Error reading topic directory ${topicDir}:`, error);
        continue;
      }
    }

    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
      console.log(`❌ Audio file not found for wordId=${wordId}, language=${audioLangCode}`);
      return NextResponse.json(
        { error: 'Audio file not found', wordId, languageCode: audioLangCode },
        { status: 404 }
      );
    }

    // Read and serve the audio file
    const audioBuffer = fs.readFileSync(audioFilePath);
    console.log(`🎵 Serving audio: ${foundFileName} (${audioBuffer.length} bytes)`);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Disposition': `inline; filename="${foundFileName}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ Alnilam Audio API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
