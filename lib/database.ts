export interface Language {
  code: string;
  name: string;
  wordCount: number;
}

export interface Topic {
  id: number;
  name: string;
  description: string;
  wordCount: number;
  icon?: string;
}

export interface VocabularyWord {
  id?: number;
  sourceWord: string;
  targetWord: string;
  confidenceScore: number;
  context?: string;
  partOfSpeech?: string;
  difficultyLevel?: string;
  exampleSentence?: string;
  learningOrder?: number;
  english_word?: string;
  turkish_word?: string;
  learning_order?: number;
}

export interface VocabularyResponse {
  success?: boolean;
  vocabulary?: VocabularyWord[];
  totalWords?: number;
  currentBatch?: number;
  hasMore?: boolean;
  error?: string;
}

// Client-side API functions
export async function getLanguages(): Promise<Language[]> {
  const response = await fetch('/api/languages');
  if (!response.ok) {
    throw new Error('Failed to fetch languages');
  }
  return response.json();
}

export async function getTopics(): Promise<Topic[]> {
  const response = await fetch('/api/topics');
  if (!response.ok) {
    throw new Error('Failed to fetch topics');
  }
  return response.json();
}

export async function getVocabularyForTopic(
  topicId: number,
  sourceLanguage: string,
  targetLanguage: string,
  limit: number = 50,
  offset: number = 0
): Promise<VocabularyResponse> {
  const params = new URLSearchParams({
    topicId: topicId.toString(),
    sourceLanguage,
    targetLanguage,
    limit: limit.toString(),
    offset: offset.toString()
  });
  
  const response = await fetch(`/api/vocabulary?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vocabulary');
  }
  return response.json();
}
