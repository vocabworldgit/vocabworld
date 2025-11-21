import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Language code mapping from our translation database
const getLanguageCode = (languageName: string): string => {
  const languageMap: { [key: string]: string } = {
    'English': 'en',
    'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Italian': 'it', 'Portuguese': 'pt',
    'Dutch': 'nl', 'Russian': 'ru', 'Chinese': 'zh', 'Japanese': 'ja', 'Korean': 'ko',
    'Arabic': 'ar', 'Hindi': 'hi', 'Turkish': 'tr', 'Polish': 'pl', 'Swedish': 'sv',
    'Norwegian': 'no', 'Danish': 'da', 'Finnish': 'fi', 'Greek': 'el', 'Hebrew': 'he',
    'Thai': 'th', 'Vietnamese': 'vi', 'Indonesian': 'id', 'Malay': 'ms', 'Czech': 'cs',
    'Hungarian': 'hu', 'Romanian': 'ro', 'Bulgarian': 'bg', 'Croatian': 'hr', 'Serbian': 'sr',
    'Slovak': 'sk', 'Slovenian': 'sl', 'Estonian': 'et', 'Latvian': 'lv', 'Lithuanian': 'lt',
    'Ukrainian': 'uk', 'Bengali': 'bn', 'Urdu': 'ur', 'Persian': 'fa', 'Afrikaans': 'af',
    'Amharic': 'am', 'Azerbaijani': 'az', 'Belarusian': 'be', 'Breton': 'br', 'Bosnian': 'bs',
    'Catalan': 'ca', 'Corsican': 'co', 'Welsh': 'cy', 'Esperanto': 'eo', 'Basque': 'eu',
    'Faroese': 'fo', 'Irish': 'ga', 'Scottish Gaelic': 'gd', 'Gujarati': 'gu', 'Hausa': 'ha',
    'Icelandic': 'is', 'Igbo': 'ig', 'Javanese': 'jv', 'Georgian': 'ka', 'Kazakh': 'kk',
    'Khmer': 'km', 'Kannada': 'kn', 'Kyrgyz': 'ky', 'Latin': 'la', 'Luxembourgish': 'lb',
    'Lao': 'lo', 'Malagasy': 'mg', 'Macedonian': 'mk', 'Malayalam': 'ml', 'Mongolian': 'mn',
    'Marathi': 'mr', 'Maltese': 'mt', 'Myanmar': 'my', 'Nepali': 'ne', 'Odia': 'or',
    'Punjabi': 'pa', 'Pashto': 'ps', 'Kinyarwanda': 'rw', 'Sanskrit': 'sa', 'Sinhala': 'si',
    'Shona': 'sn', 'Somali': 'so', 'Albanian': 'sq', 'Swahili': 'sw', 'Tamil': 'ta',
    'Telugu': 'te', 'Tajik': 'tg', 'Turkmen': 'tk', 'Filipino': 'tl', 'Uzbek': 'uz',
    'Xhosa': 'xh', 'Yoruba': 'yo', 'Zulu': 'zu'
  };
  return languageMap[languageName] || 'en';
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const sourceLanguage = searchParams.get('sourceLanguage');
    const targetLanguage = searchParams.get('targetLanguage');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 API Request (Supabase):', {
      topicId,
      sourceLanguage,
      targetLanguage,
      limit,
      offset
    });

    if (!topicId || !sourceLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({
        vocabulary: [],
        totalWords: 0,
        currentBatch: 0,
        hasMore: false
      });
    }

    // Get total word count for the topic using Supabase
    const { count: totalCount, error: countError } = await supabase
      .from('vocabulary')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    if (countError) {
      console.error('❌ Error getting total count:', countError);
      return NextResponse.json({ error: 'Failed to get word count' }, { status: 500 });
    }

    // Get English vocabulary from Supabase
    const { data: englishWords, error: vocabError } = await supabase
      .from('vocabulary')
      .select(`
        id,
        word_en,
        context,
        part_of_speech,
        difficulty_level,
        example_sentence,
        learning_order
      `)
      .eq('topic_id', topicId)
      .order('learning_order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (vocabError) {
      console.error('❌ Error fetching vocabulary:', vocabError);
      return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
    }

    // Convert language names to codes
    const sourceLanguageCode = getLanguageCode(sourceLanguage);
    const targetLanguageCode = getLanguageCode(targetLanguage);

    // Get translations for both source and target languages
    const vocabulary = [];
    
    for (const word of englishWords || []) {
      let sourceWord = word.word_en; // Default to English
      let targetWord = word.word_en; // Default to English
      
      console.log(`🔤 Processing word: "${word.word_en}" (ID: ${word.id})`);
      
      // Get source language translation (if not English)
      if (sourceLanguageCode !== 'en') {
        const { data: sourceTranslation, error: sourceError } = await supabase
          .from('vocabulary_translations')
          .select('translated_word')
          .eq('vocabulary_id', word.id)
          .eq('language_code', sourceLanguageCode)
          .single();
        
        console.log(`   Source (${sourceLanguageCode}):`, sourceTranslation?.translated_word || 'NOT FOUND');
        
        if (sourceTranslation && sourceTranslation.translated_word) {
          sourceWord = sourceTranslation.translated_word;
        }
      }
      
      // Get target language translation (if not English)
      if (targetLanguageCode !== 'en') {
        const { data: targetTranslation, error: targetError } = await supabase
          .from('vocabulary_translations')
          .select('translated_word')
          .eq('vocabulary_id', word.id)
          .eq('language_code', targetLanguageCode)
          .single();
        
        console.log(`   Target (${targetLanguageCode}):`, targetTranslation?.translated_word || 'NOT FOUND');
        
        if (targetTranslation && targetTranslation.translated_word) {
          targetWord = targetTranslation.translated_word;
        }
      }

      const vocabItem = {
        id: word.id, // Include the word ID for audio system
        sourceWord: sourceWord,
        targetWord: targetWord,
        confidenceScore: 0.95,
        context: word.context,
        partOfSpeech: word.part_of_speech,
        difficultyLevel: word.difficulty_level,
        exampleSentence: word.example_sentence,
        learningOrder: word.learning_order
      };
      
      console.log(`   Result: "${vocabItem.sourceWord}" → "${vocabItem.targetWord}"`);
      vocabulary.push(vocabItem);
    }
    
    return NextResponse.json({
      vocabulary: vocabulary,
      totalWords: totalCount || 0,
      currentBatch: vocabulary.length,
      hasMore: (offset + vocabulary.length) < (totalCount || 0),
      dataSource: 'supabase' // Indicator that we're using Supabase
    });
    
  } catch (error) {
    console.error('❌ Error fetching vocabulary from Supabase:', error);
    return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
  }
}