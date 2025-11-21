// Client-side data loading functions to replace API routes
// This avoids the Next.js static export + API routes incompatibility

export async function loadTopics() {
  try {
    const response = await fetch('/data/topics.json');
    if (!response.ok) {
      throw new Error('Failed to load topics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading topics:', error);
    return [];
  }
}

export async function loadVocabulary(topicId: string | number, fromLanguage = 'en', toLanguage = 'es', page = 1, limit = 20) {
  try {
    const response = await fetch('/data/vocabulary.json');
    if (!response.ok) {
      throw new Error('Failed to load vocabulary');
    }
    
    const allVocabulary = await response.json();
    const topicVocabulary = allVocabulary[topicId] || [];
    
    // Filter words that have the required translation
    const filteredWords = topicVocabulary.filter((word: any) => {
      const hasFromLanguage = fromLanguage === 'en' ? 
        word.english : 
        word.translations[fromLanguage]?.word;
      const hasToLanguage = toLanguage === 'en' ? 
        word.english : 
        word.translations[toLanguage]?.word;
      
      return hasFromLanguage && hasToLanguage;
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWords = filteredWords.slice(startIndex, endIndex);
    
    // Format the response to match the expected API structure
    const formattedWords = paginatedWords.map((word: any) => ({
      id: word.id,
      topic_id: word.topic_id,
      from_word: fromLanguage === 'en' ? 
        word.english : 
        word.translations[fromLanguage]?.word || '',
      to_word: toLanguage === 'en' ? 
        word.english : 
        word.translations[toLanguage]?.word || '',
      context: word.context,
      part_of_speech: word.part_of_speech,
      difficulty_level: word.difficulty_level,
      frequency_rank: word.frequency_rank,
      learning_order: word.learning_order,
      example_sentence: word.example_sentence,
      confidence_score: toLanguage === 'en' ? 
        1.0 : 
        word.translations[toLanguage]?.confidence || 0.95
    }));
    
    return {
      words: formattedWords,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredWords.length / limit),
        totalWords: filteredWords.length,
        hasNextPage: endIndex < filteredWords.length,
        hasPreviousPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error loading vocabulary:', error);
    return {
      words: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalWords: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
  }
}

// Get available languages for a specific topic
export async function getAvailableLanguages(topicId: string | number) {
  try {
    const response = await fetch('/data/vocabulary.json');
    if (!response.ok) {
      throw new Error('Failed to load vocabulary');
    }
    
    const allVocabulary = await response.json();
    const topicVocabulary = allVocabulary[topicId] || [];
    
    if (topicVocabulary.length === 0) {
      return ['en']; // Always have English
    }
    
    // Collect all available language codes
    const languageSet = new Set(['en']); // Always include English
    
    topicVocabulary.forEach((word: any) => {
      Object.keys(word.translations || {}).forEach(langCode => {
        languageSet.add(langCode);
      });
    });
    
    return Array.from(languageSet).sort();
  } catch (error) {
    console.error('Error getting available languages:', error);
    return ['en'];
  }
}

// Language code to display name mapping
export const languageNames = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'bn': 'Bengali',
  'uk': 'Ukrainian',
  'pl': 'Polish',
  'tr': 'Turkish',
  'fa': 'Persian',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'he': 'Hebrew',
  'cs': 'Czech',
  'sk': 'Slovak',
  'hr': 'Croatian',
  'bg': 'Bulgarian',
  'ro': 'Romanian',
  'hu': 'Hungarian',
  'fi': 'Finnish',
  'da': 'Danish',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'nl': 'Dutch',
  'el': 'Greek',
  'sr': 'Serbian',
  'sl': 'Slovenian',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'et': 'Estonian',
  'sq': 'Albanian',
  'mk': 'Macedonian',
  'ka': 'Georgian',
  'mt': 'Maltese',
  'ga': 'Irish',
  'cy': 'Welsh',
  'eu': 'Basque',
  'ca': 'Catalan',
  'co': 'Corsican',
  'lb': 'Luxembourgish'
};
