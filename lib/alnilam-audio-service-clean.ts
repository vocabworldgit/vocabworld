// Alnilam Audio Service - Clean version for component integration
// Connects to the comprehensive audio library generated with Alnilam voice personality

export interface AlnilamAudioSettings {
  autoPlay: boolean;
  trainingVoice: 'Female' | 'Male';  // Future implementation
  mainVoice: 'Female' | 'Male';      // Future implementation
  speed: 'Slow' | 'Normal' | 'Fast';
  pauseBetweenTranslations: number;   // 0.2s to 10s
  pauseForNextWord: number;           // 0.2s to 10s
  repeatTargetWord: number;           // 1x to 5x
  repeatMainWord: number;             // 1x to 5x
}

export class AlnilamAudioService {
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private currentSequence: AbortController | null = null;

  constructor() {
    console.log('🌊 Alnilam Audio Service initialized - Beautiful multilingual TTS');
  }

  /**
   * Get audio URL for a specific word and language
   */
  private getAudioUrl(wordId: number, languageCode: string, topicName?: string): string {
    const params = new URLSearchParams({
      wordId: wordId.toString(),
      languageCode: languageCode
    });
    
    if (topicName) {
      params.append('topic', topicName);
    }
    
    return `/api/alnilam-audio?${params.toString()}`;
  }

  /**
   * Preload audio for better performance
   */
  private async preloadAudio(url: string): Promise<HTMLAudioElement> {
    if (this.audioCache.has(url)) {
      return this.audioCache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        this.audioCache.set(url, audio);
        console.log(`✅ Alnilam audio preloaded: ${url}`);
        resolve(audio);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('❌ Alnilam audio preload failed:', url, e);
        reject(e);
      });
      
      // Trigger loading
      audio.load();
    });
  }

  /**
   * Play a single word audio file
   */
  async playWordAudio(
    wordId: number, 
    languageCode: string, 
    topicName?: string
  ): Promise<boolean> {
    try {
      console.log(`🌊 Alnilam playing: word ${wordId} in ${languageCode}`);
      
      // Stop any currently playing audio
      this.stopAudio();
      
      const audioUrl = this.getAudioUrl(wordId, languageCode, topicName);
      console.log(`🎯 Constructed audio URL: ${audioUrl}`);
      
      // Check if file exists by trying to load it
      let audio: HTMLAudioElement;
      try {
        console.log(`🔄 Attempting to preload audio from: ${audioUrl}`);
        audio = await this.preloadAudio(audioUrl);
        console.log(`✅ Audio preloaded successfully`);
      } catch (error) {
        console.warn(`❌ Alnilam audio not found: ${audioUrl}`, error);
        return false;
      }

      // Play the audio
      this.currentAudio = audio;
      this.isPlaying = true;
      
      console.log(`▶️ Starting audio playback for word ${wordId}`);
      return new Promise((resolve) => {
        const onEnded = () => {
          console.log(`✅ Alnilam audio completed: word ${wordId}`);
          this.isPlaying = false;
          this.currentAudio = null;
          resolve(true);
        };

        const onError = (error: any) => {
          console.error(`❌ Alnilam audio playback error:`, error);
          this.isPlaying = false;
          this.currentAudio = null;
          resolve(false);
        };

        audio.addEventListener('ended', onEnded, { once: true });
        audio.addEventListener('error', onError, { once: true });
        
        // Start playback
        audio.play().catch((error) => {
          console.error(`❌ Audio play() failed:`, error);
          onError(error);
        });
      });

    } catch (error) {
      console.error('❌ Alnilam playWordAudio error:', error);
      this.isPlaying = false;
      this.currentAudio = null;
      return false;
    }
  }

  /**
   * Stop any currently playing audio
   */
  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    this.isPlaying = false;
    
    // Cancel any ongoing sequence
    if (this.currentSequence) {
      this.currentSequence.abort();
      this.currentSequence = null;
    }
  }

  /**
   * Sleep utility for controlled timing
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Compatibility method for existing component interface
   * Adapts the component's call to our internal interface
   */
  async playWordSequence(
    word: { id: number; sourceWord: string; targetWord: string },
    targetLanguage: string,
    nativeLanguage: string,
    componentSettings: {
      speed: 'Slow' | 'Normal' | 'Fast';
      pauseBetweenTranslations: number;
      pauseForNextWord: number;
      repeatTargetLanguage: number;
      repeatMainLanguage: number;
      setCurrentAudioStep?: (step: string) => void;
    }
  ): Promise<boolean> {
    try {
      console.log(`🌟 Alnilam adapter: "${word.sourceWord}" → "${word.targetWord}"`);

      // Convert language names to codes
      const sourceLanguageCode = this.getLanguageCode(targetLanguage);
      const targetLanguageCode = this.getLanguageCode(nativeLanguage);

      if (!sourceLanguageCode) {
        console.warn(`❌ Unknown source language: ${targetLanguage}`);
        return false;
      }

      console.log(`🌊 Playing word ${word.id}: ${word.sourceWord} (${targetLanguage}) → ${word.targetWord} (${nativeLanguage})`);

      // Step 1: Play training language (what user is learning)
      if (componentSettings.setCurrentAudioStep) {
        componentSettings.setCurrentAudioStep('training');
      }
      
      console.log(`🎯 Step 1: Playing training language - wordId: ${word.id}, language: ${sourceLanguageCode}`);
      for (let i = 0; i < componentSettings.repeatTargetLanguage; i++) {
        const success = await this.playWordAudio(word.id, sourceLanguageCode);
        console.log(`🎯 Training language attempt ${i + 1}: ${success ? 'SUCCESS' : 'FAILED'}`);
        if (!success) {
          console.warn(`❌ Failed to play training language for word ${word.id}`);
          return false;
        }
        if (i < componentSettings.repeatTargetLanguage - 1) {
          await this.sleep(300); // Brief pause between repeats
        }
      }

      // Pause between languages
      if (componentSettings.setCurrentAudioStep) {
        componentSettings.setCurrentAudioStep('pause');
      }
      await this.sleep(componentSettings.pauseBetweenTranslations * 1000);

      // Step 2: Play native language (user's target language) 
      if (componentSettings.setCurrentAudioStep) {
        componentSettings.setCurrentAudioStep('main');
      }
      
      console.log(`🎯 Step 2: Playing native language - wordId: ${word.id}, language: ${targetLanguageCode || 'en'}`);
      for (let i = 0; i < componentSettings.repeatMainLanguage; i++) {
        // For native language, try to find English audio first, then fall back to target language audio
        let success = false;
        if (targetLanguageCode && targetLanguageCode !== 'en') {
          success = await this.playWordAudio(word.id, 'en'); // Try English first
        }
        if (!success && targetLanguageCode) {
          success = await this.playWordAudio(word.id, targetLanguageCode);
        }
        
        console.log(`🎯 Native language attempt ${i + 1}: ${success ? 'SUCCESS' : 'FAILED'}`);
        if (!success) {
          console.warn(`❌ Failed to play native language for word ${word.id}`);
          return false;
        }
        if (i < componentSettings.repeatMainLanguage - 1) {
          await this.sleep(300); // Brief pause between repeats
        }
      }

      if (componentSettings.setCurrentAudioStep) {
        componentSettings.setCurrentAudioStep('idle');
      }

      console.log('✅ Alnilam word sequence completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Alnilam sequence error:', error);
      if (componentSettings.setCurrentAudioStep) {
        componentSettings.setCurrentAudioStep('idle');
      }
      return false;
    }
  }

  /**
   * Convert language name to language code for file lookup
   */
  private getLanguageCode(languageName: string): string | null {
    const languageMap: { [key: string]: string } = {
      'Arabic': 'ar',
      'German': 'de', 
      'Spanish': 'es',
      'French': 'fr',
      'Hindi': 'hi',
      'Indonesian': 'id',
      'Italian': 'it',
      'Japanese': 'ja',
      'Korean': 'ko',
      'Portuguese': 'pt',
      'Russian': 'ru',
      'Dutch': 'nl',
      'Polish': 'pl', 
      'Thai': 'th',
      'Turkish': 'tr',
      'Vietnamese': 'vi',
      'Romanian': 'ro',
      'Ukrainian': 'uk',
      'Bengali': 'bn',
      'Marathi': 'mr',
      'Tamil': 'ta',
      'Telugu': 'te',
      'English': 'en'
    };
    
    return languageMap[languageName] || null;
  }

  /**
   * Clear audio cache (useful for memory management)
   */
  clearCache(): void {
    this.audioCache.clear();
    console.log('🧹 Alnilam audio cache cleared');
  }
}

// Export singleton instance
export const alnilamAudioService = new AlnilamAudioService();
