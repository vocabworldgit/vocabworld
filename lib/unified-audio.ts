// Unified Audio Service
// Handles both pre-generated Umbriel voice and fallback TTS

import { PreGeneratedAudioService, AudioManifest, AudioWord, AudioSettings } from './pre-generated-audio';

// Re-export types
export type { AudioWord, AudioManifest, AudioSettings } from './pre-generated-audio';

export interface UnifiedAudioSettings extends AudioSettings {
  preferPreGenerated: boolean;
  enableFallback: boolean;
}

export interface PlaybackStatus {
  isPlaying: boolean;
  currentWordIndex: number;
  currentStep: 'training' | 'main' | 'pause' | 'idle';
  usingPreGenerated: boolean;
  totalWords: number;
}

export class UnifiedAudioService {
  private preGeneratedService: PreGeneratedAudioService;
  private currentManifest: AudioManifest | null = null;
  private currentWords: AudioWord[] = [];
  private playbackStatus: PlaybackStatus = {
    isPlaying: false,
    currentWordIndex: -1,
    currentStep: 'idle',
    usingPreGenerated: false,
    totalWords: 0
  };
  
  // Event callbacks
  private onPlaybackStatusChange?: (status: PlaybackStatus) => void;
  private onWordChange?: (index: number, word: AudioWord) => void;
  private onComplete?: () => void;
  
  constructor() {
    this.preGeneratedService = new PreGeneratedAudioService();
  }
  
  /**
   * Initialize audio service for a topic
   */
  async initializeTopic(topicId: number): Promise<boolean> {
    console.log(`🎵 Initializing audio service for topic ${topicId}`);
    
    // Try to load pre-generated audio manifest
    this.currentManifest = await this.preGeneratedService.loadManifest(topicId);
    
    if (this.currentManifest) {
      this.currentWords = this.currentManifest.words.sort((a, b) => 
        a.learning_order - b.learning_order
      );
      
      console.log(`✅ Pre-generated audio available: ${this.currentWords.length} words`);
      console.log(`📊 Success rate: ${this.currentManifest.statistics.success_rate}%`);
      console.log(`🎤 Voice: ${this.currentManifest.audio_config.voice}`);
      
      return true;
    } else {
      console.log(`ℹ️ No pre-generated audio for topic ${topicId}, will use fallback TTS`);
      return false;
    }
  }
  
  /**
   * Load vocabulary from database (fallback when no pre-generated audio)
   */
  async loadVocabulary(vocabulary: any[]): Promise<void> {
    console.log(`📚 Loading vocabulary: ${vocabulary.length} words`);
    
    this.currentWords = vocabulary.map((word, index) => ({
      id: word.id || index,
      english_word: word.english_word || word.word || '',
      turkish_word: word.turkish_word || word.translation || '',
      learning_order: index + 1,
      context: word.context || '',
      audio_files: {
        en: null,
        tr: null
      },
      status: 'no_audio'
    }));
    
    this.updatePlaybackStatus({ totalWords: this.currentWords.length });
  }
  
  /**
   * Play a specific word by index
   */
  async playWordByIndex(
    index: number, 
    settings: UnifiedAudioSettings
  ): Promise<void> {
    if (index < 0 || index >= this.currentWords.length) {
      console.error(`Invalid word index: ${index}`);
      return;
    }
    
    const word = this.currentWords[index];
    
    this.updatePlaybackStatus({
      isPlaying: true,
      currentWordIndex: index,
      usingPreGenerated: this.hasPreGeneratedAudio(word)
    });
    
    this.onWordChange?.(index, word);
    
    try {
      if (this.hasPreGeneratedAudio(word) && settings.preferPreGenerated) {
        console.log(`🎵 Using pre-generated Umbriel voice for: "${word.english_word}"`);
        await this.preGeneratedService.playWord(
          word, 
          settings,
          (step) => this.updatePlaybackStatus({ currentStep: step })
        );
      } else if (settings.enableFallback) {
        console.log(`🔄 Using fallback TTS for: "${word.english_word}"`);
        await this.playWordWithFallback(word, settings);
      } else {
        console.warn(`⚠️ No audio available for: "${word.english_word}"`);
      }
    } catch (error) {
      console.error('Error playing word:', error);
    } finally {
      this.updatePlaybackStatus({
        isPlaying: false,
        currentStep: 'idle'
      });
    }
  }
  
  /**
   * Auto-play all words in order
   */
  async playAllWords(settings: UnifiedAudioSettings): Promise<void> {
    if (this.currentWords.length === 0) {
      console.warn('No words to play');
      return;
    }
    
    console.log(`🎵 Starting auto-play: ${this.currentWords.length} words`);
    
    this.updatePlaybackStatus({
      isPlaying: true,
      currentWordIndex: 0,
      totalWords: this.currentWords.length
    });
    
    for (let i = 0; i < this.currentWords.length; i++) {
      if (!this.playbackStatus.isPlaying) {
        console.log('Auto-play stopped by user');
        break;
      }
      
      await this.playWordByIndex(i, settings);
      
      // Pause between words (except last word)
      if (i < this.currentWords.length - 1 && this.playbackStatus.isPlaying) {
        this.updatePlaybackStatus({ currentStep: 'pause' });
        await this.sleep(settings.pauseForNextWord * 1000);
      }
    }
    
    console.log('🎵 Auto-play completed');
    this.updatePlaybackStatus({
      isPlaying: false,
      currentWordIndex: -1,
      currentStep: 'idle'
    });
    
    this.onComplete?.();
  }
  
  /**
   * Stop audio playback
   */
  stop(): void {
    console.log('🛑 Stopping unified audio playback');
    
    this.preGeneratedService.stop();
    
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    this.updatePlaybackStatus({
      isPlaying: false,
      currentStep: 'idle'
    });
  }
  
  /**
   * Check if word has pre-generated audio
   */
  private hasPreGeneratedAudio(word: AudioWord): boolean {
    return !!(word.audio_files.en || word.audio_files.tr);
  }
  
  /**
   * Play word using fallback browser TTS
   */
  private async playWordWithFallback(
    word: AudioWord, 
    settings: UnifiedAudioSettings
  ): Promise<void> {
    console.log(`🔄 Fallback TTS: "${word.english_word}" → "${word.turkish_word}"`);
    
    // Training language (English)
    for (let i = 0; i < settings.repeatTargetLanguage; i++) {
      if (!this.playbackStatus.isPlaying) break;
      
      this.updatePlaybackStatus({ currentStep: 'training' });
      await this.speakText(word.english_word, 'en-US', settings);
      
      if (i < settings.repeatTargetLanguage - 1) {
        await this.sleep(300);
      }
    }
    
    // Pause between languages
    if (this.playbackStatus.isPlaying) {
      this.updatePlaybackStatus({ currentStep: 'pause' });
      await this.sleep(settings.pauseBetweenTranslations * 1000);
    }
    
    // Main language (Turkish)
    for (let i = 0; i < settings.repeatMainLanguage; i++) {
      if (!this.playbackStatus.isPlaying) break;
      
      this.updatePlaybackStatus({ currentStep: 'main' });
      await this.speakText(word.turkish_word, 'tr-TR', settings);
      
      if (i < settings.repeatMainLanguage - 1) {
        await this.sleep(300);
      }
    }
  }
  
  /**
   * Speak text using browser TTS
   */
  private speakText(text: string, languageCode: string, settings: UnifiedAudioSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = this.getSpeedRate(settings.pronunciationSpeed);
      
      // Try to get appropriate voice
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => 
        v.lang.startsWith(languageCode.split('-')[0])
      );
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      
      speechSynthesis.speak(utterance);
    });
  }
  
  /**
   * Update playback status and notify listeners
   */
  private updatePlaybackStatus(updates: Partial<PlaybackStatus>): void {
    this.playbackStatus = { ...this.playbackStatus, ...updates };
    this.onPlaybackStatusChange?.(this.playbackStatus);
  }
  
  /**
   * Get current playback status
   */
  getPlaybackStatus(): PlaybackStatus {
    return { ...this.playbackStatus };
  }
  
  /**
   * Get current words array
   */
  getCurrentWords(): AudioWord[] {
    return [...this.currentWords];
  }
  
  /**
   * Get current manifest info
   */
  getManifestInfo(): AudioManifest | null {
    return this.currentManifest;
  }
  
  /**
   * Set event callbacks
   */
  setEventHandlers(handlers: {
    onPlaybackStatusChange?: (status: PlaybackStatus) => void;
    onWordChange?: (index: number, word: AudioWord) => void;
    onComplete?: () => void;
  }): void {
    this.onPlaybackStatusChange = handlers.onPlaybackStatusChange;
    this.onWordChange = handlers.onWordChange;
    this.onComplete = handlers.onComplete;
  }
  
  /**
   * Get playback speed rate
   */
  private getSpeedRate(speed: 'Slow' | 'Normal' | 'Fast'): number {
    switch (speed) {
      case 'Slow': return 0.7;
      case 'Fast': return 1.3;
      default: return 1.0;
    }
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
