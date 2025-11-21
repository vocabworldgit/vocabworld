import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Cache for Backblaze URL mappings
let urlMappings: Map<string, string> | null = null;

// Load Backblaze URL mappings from CSV file
async function loadUrlMappings(): Promise<Map<string, string>> {
  if (urlMappings) return urlMappings;

  try {
    const csvPath = path.join(process.cwd(), 'backblaze-urls-20250909-180354.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    urlMappings = new Map();

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse CSV line (handle quoted fields)
      const matches = line.match(/"([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"/);
      if (matches) {
        const [, localPath, backblazeUrl] = matches;
        urlMappings.set(localPath, backblazeUrl);
      }
    }

    console.log(`✅ Loaded ${urlMappings.size} Backblaze URL mappings`);
    return urlMappings;
  } catch (error) {
    console.error('❌ Failed to load Backblaze URL mappings:', error);
    return new Map();
  }
}

// Language code mapping to match your audio library folders
const getLanguageCode = (languageName: string): string => {
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
    
    // Extended language mappings for completeness
    'Afrikaans': 'af', 'Amharic': 'am', 'Azerbaijani': 'az', 'Belarusian': 'be', 
    'Breton': 'br', 'Bosnian': 'bs', 'Corsican': 'co', 'Esperanto': 'eo', 
    'Faroese': 'fo', 'Scottish Gaelic': 'gd', 'Hausa': 'ha', 'Igbo': 'ig', 
    'Javanese': 'jv', 'Georgian': 'ka', 'Kazakh': 'kk', 'Khmer': 'km', 
    'Kannada': 'kn', 'Kyrgyz': 'ky', 'Latin': 'la', 'Luxembourgish': 'lb',
    'Lao': 'lo', 'Malagasy': 'mg', 'Mongolian': 'mn', 'Myanmar': 'my', 
    'Nepali': 'ne', 'Odia': 'or', 'Punjabi': 'pa', 'Pashto': 'ps', 
    'Kinyarwanda': 'rw', 'Sanskrit': 'sa', 'Sinhala': 'si', 'Shona': 'sn', 
    'Somali': 'so', 'Albanian': 'sq', 'Swahili': 'sw', 'Tajik': 'tg', 
    'Turkmen': 'tk', 'Filipino': 'tl', 'Uzbek': 'uz', 'Xhosa': 'xh', 
    'Yoruba': 'yo', 'Zulu': 'zu', 'Malay': 'ms', 'Serbian': 'sr'
  };
  return languageMap[languageName] || languageMap[languageName.toLowerCase()] || languageName.toLowerCase();
};

// Topic name to folder name mapping
const getTopicFolderName = (topicName: string): string => {
  const topicMap: { [key: string]: string } = {
    'Greetings': 'greetings',
    'Numbers': 'numbers',
    'Time & Dates': 'time_dates',
    'Directions & Transportation': 'directions_transportation',
    'Shopping & Money': 'shopping_money',
    'Food, Drinks & Restaurants': 'food_drinks_restaurants',
    'Emergency & Safety': 'emergency_safety',
    'Health & Body Parts': 'health_body_parts',
    'Home & Household Items': 'home_household_items',
    'Clothing & Personal Style': 'clothing_personal_style',
    'Weather & Seasons': 'weather_seasons',
    'Family & Relationships': 'family_relationships',
    'Emotions & Feelings': 'emotions_feelings',
    'Personality & Character': 'personality_character',
    'Hobbies & Leisure Activities': 'hobbies_leisure_activities',
    'Sports & Fitness': 'sports_fitness',
    'Places Around Town': 'places_around_town',
    'Travel & Tourism': 'travel_tourism',
    'Colors & Shapes': 'colors_shapes',
    'Nature': 'nature',
    'Actions': 'actions',
    'Adjectives': 'adjectives',
    'Arts & Entertainment': 'arts_entertainment',
    'Technology & Gadgets': 'technology_gadgets',
    'Work & Professions': 'work_professions',
    'Education & School Life': 'education_school_life',
    'Communication & Media': 'communication_media',
    'Environment & Sustainability': 'environment_sustainability',
    'Business & Economics': 'business_economics',
    'Common Collocations': 'common_collocations',
    'Slang & Modern Expressions': 'slang_modern_expressions',
    'Science & Technology': 'science_technology',
    'Mathematics & Geometry': 'mathematics_geometry',
    'History & Culture': 'history_culture',
    'Politics & Law': 'politics_law',
    'Religion & Philosophy': 'religion_philosophy',
    'Mythology & Fantasy': 'mythology_fantasy',
    'Celebrations & Holidays': 'celebrations_holidays',
    'Advanced Communication & Formal Language': 'advanced_communication_formal_language',
    'Cultural Integration & Global Perspectives': 'cultural_integration_global_perspectives'
  };
  return topicMap[topicName] || topicName.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get('wordId');
    const language = searchParams.get('language');
    const topicName = searchParams.get('topicName');
    const word = searchParams.get('word');

    console.log('🎵 Audio API Request:', {
      wordId,
      language,
      topicName,
      word
    });

    if (!wordId || !language || !topicName || !word) {
      return NextResponse.json({
        error: 'Missing required parameters: wordId, language, topicName, word'
      }, { status: 400 });
    }

    // Get language code for audio library folder
    const languageCode = getLanguageCode(language);

    // Get topic folder name
    const topicFolder = getTopicFolderName(topicName);

    // Clean word for filename (remove spaces, special chars)
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Load Backblaze URL mappings
    const mappings = await loadUrlMappings();

    // Try different file name patterns to find the audio URL
    const filePatterns = [
      `alnilam_${wordId}_${cleanWord}.wav`,
      `alnilam_${wordId}_${word.toLowerCase()}.wav`,
      `alnilam_${wordId}.wav`,
      `${wordId}_${cleanWord}.wav`,
      `${cleanWord}.wav`
    ];

    for (const fileName of filePatterns) {
      const localPath = `${languageCode}/${topicFolder}/${fileName}`;

      if (mappings.has(localPath)) {
        const audioUrl = mappings.get(localPath)!;

        console.log('✅ Audio URL found:', audioUrl);

        return NextResponse.json({
          audioUrl,
          wordId,
          language: languageCode,
          topicName,
          word,
          fileName,
          exists: true,
          source: 'backblaze'
        });
      }
    }

    console.log('❌ Audio file not found in Backblaze mappings');

    return NextResponse.json({
      error: 'Audio file not found',
      wordId,
      language: languageCode,
      topicName,
      word,
      searchedPatterns: filePatterns,
      exists: false
    }, { status: 404 });

  } catch (error) {
    console.error('❌ Audio API Error:', error);
    return NextResponse.json({
      error: 'Failed to process audio request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}