// Pre-generated Audio Service
// Handles playback of pre-generated Umbriel voice audio files

export interface AudioManifest {
  topic: {
    id: number;
    title: string;
    total_words: number;
    generated_at: string;
    description: string;
  };
  statistics: {
    successful: number;
    failed: number;
    success_rate: number;
  };
  audio_config: {
    format: string;
    quality: string;
    voice: string;
    encoding: string;
  };
  words: AudioWord[];
}

export interface AudioWord {
  id: number;
  english_word: string;
  turkish_word: string;
  learning_order: number;
  context: string;
  audio_files: {
    en: string | null;
    tr: string | null;
  };
  status: string;
}

export interface AudioSettings {
  autoPlay: boolean;
  trainingLanguageVoice: 'Male' | 'Female';
  mainLanguageVoice: 'Male' | 'Female';
  pronunciationSpeed: 'Slow' | 'Normal' | 'Fast';
  pauseBetweenTranslations: number;
  pauseForNextWord: number;
  repeatTargetLanguage: number;
  repeatMainLanguage: number;
}

export class PreGeneratedAudioService {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  
  constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      document.addEventListener('click', this.initializeAudioContext.bind(this), { once: true });
    }
  }
  
  private initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  
  /**
   * Load audio manifest for a topic
   */
  async loadManifest(topicId: number): Promise<AudioManifest | null> {
    try {
      const manifestPath = `/audio/${this.getTopicManifestName(topicId)}`;
      const response = await fetch(manifestPath);
      
      if (!response.ok) {
        console.warn(`No pre-generated audio manifest found for topic ${topicId}`);
        return null;
      }
      
      const manifest: AudioManifest = await response.json();
      console.log(`📻 Loaded audio manifest for ${manifest.topic.title}:`, {
        words: manifest.words.length,
        success_rate: manifest.statistics.success_rate,
        voice: manifest.audio_config.voice
      });
      
      return manifest;
    } catch (error) {
      console.error('Error loading audio manifest:', error);
      return null;
    }
  }
  
  /**
   * Get manifest filename for topic
   */
  private getTopicManifestName(topicId: number): string {
    const topicNames: { [key: number]: string } = {
      1: 'greetings-manifest.json',
      // Add more topics as they're generated
    };
    
    return topicNames[topicId] || `topic-${topicId}-manifest.json`;
  }
  
  /**
   * Play audio for a word with Umbriel's teaching voice
   */
  async playWord(
    word: AudioWord, 
    settings: AudioSettings,
    onStepChange?: (step: 'training' | 'main' | 'pause' | 'idle') => void
  ): Promise<void> {
    if (this.isPlaying) {
      console.log('Audio already playing, stopping current...');
      this.stop();
    }
    
    this.isPlaying = true;
    
    try {
      console.log(`🎵 Playing word: "${word.english_word}" → "${word.turkish_word}"`);
      
      // Training language (what user wants to learn) - English in this case
      for (let i = 0; i < settings.repeatTargetLanguage; i++) {
        if (!this.isPlaying) break;
        
        onStepChange?.('training');
        
        if (word.audio_files.en) {
          await this.playAudioFile(`/audio/en/${word.audio_files.en}`, settings.pronunciationSpeed);
        } else {
          // Fallback to browser TTS if no pre-generated audio
          await this.fallbackSpeak(word.english_word, 'en-US', settings);
        }
        
        if (i < settings.repeatTargetLanguage - 1) {
          await this.sleep(300); // Small pause between repetitions
        }
      }
      
      // Pause between languages
      if (this.isPlaying) {
        onStepChange?.('pause');
        await this.sleep(settings.pauseBetweenTranslations * 1000);
      }
      
      // Main language (user's native language) - Turkish in this case
      for (let i = 0; i < settings.repeatMainLanguage; i++) {
        if (!this.isPlaying) break;
        
        onStepChange?.('main');
        
        if (word.audio_files.tr) {
          await this.playAudioFile(`/audio/tr/${word.audio_files.tr}`, settings.pronunciationSpeed);
        } else {
          // Fallback to browser TTS for Turkish
          await this.fallbackSpeak(word.turkish_word, 'tr-TR', settings);
        }
        
        if (i < settings.repeatMainLanguage - 1) {
          await this.sleep(300); // Small pause between repetitions
        }
      }
      
      onStepChange?.('idle');
      
    } catch (error) {
      console.error('Error playing word audio:', error);
      onStepChange?.('idle');
    } finally {
      this.isPlaying = false;
    }
  }
  
  /**
   * Play pre-generated audio file
   */
  private playAudioFile(audioPath: string, speed: 'Slow' | 'Normal' | 'Fast'): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🎵 Playing pre-generated audio: ${audioPath}`);
      
      const audio = new Audio(audioPath);
      this.currentAudio = audio;
      
      // Set playback speed
      audio.playbackRate = this.getSpeedRate(speed);
      
      audio.onloadeddata = () => {
        console.log(`✅ Audio loaded: ${audioPath} (${audio.duration?.toFixed(1)}s)`);
      };
      
      audio.onended = () => {
        console.log(`✅ Audio finished: ${audioPath}`);
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error(`❌ Audio error for ${audioPath}:`, error);
        reject(new Error(`Failed to play audio: ${audioPath}`));
      };
      
      audio.play().catch(error => {
        console.error(`❌ Audio play failed for ${audioPath}:`, error);
        reject(error);
      });
    });
  }
  
  /**
   * Fallback to browser TTS when pre-generated audio not available
   */
  private fallbackSpeak(text: string, languageCode: string, settings: AudioSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🔄 Fallback TTS: "${text}" (${languageCode})`);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = this.getSpeedRate(settings.pronunciationSpeed);
      
      // Try to get a male voice (since we're using Umbriel)
      const voices = speechSynthesis.getVoices();
      const maleVoice = voices.find(voice => 
        voice.lang.startsWith(languageCode.split('-')[0]) && 
        voice.name.toLowerCase().includes('male')
      );
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      
      speechSynthesis.speak(utterance);
    });
  }
  
  /**
   * Stop current audio playback
   */
  stop(): void {
    console.log('🛑 Stopping audio playback');
    this.isPlaying = false;
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  }
  
  /**
   * Auto-play through all words in order
   */
  async playAll(
    words: AudioWord[], 
    settings: AudioSettings,
    onWordChange?: (index: number) => void,
    onStepChange?: (step: 'training' | 'main' | 'pause' | 'idle') => void,
    onComplete?: () => void
  ): Promise<void> {
    console.log(`🎵 Starting auto-play for ${words.length} words`);
    
    for (let i = 0; i < words.length; i++) {
      if (!this.isPlaying) {
        console.log('Auto-play stopped by user');
        break;
      }
      
      console.log(`🎵 Auto-play word ${i + 1}/${words.length}: "${words[i].english_word}"`);
      
      onWordChange?.(i);
      
      try {
        await this.playWord(words[i], settings, onStepChange);
        
        // Pause before next word (except for last word)
        if (i < words.length - 1 && this.isPlaying) {
          onStepChange?.('pause');
          await this.sleep(settings.pauseForNextWord * 1000);
        }
        
      } catch (error) {
        console.error(`Error playing word ${i + 1}:`, error);
        // Continue with next word
      }
    }
    
    console.log('🎵 Auto-play completed');
    onStepChange?.('idle');
    onComplete?.();
  }
  
  /**
   * Get playback speed rate
   */
  private getSpeedRate(speed: 'Slow' | 'Normal' | 'Fast'): number {
    switch (speed) {
      case 'Slow': return 0.7;
      case 'Fast': return 1.3;
      default: return 1.0; // Normal
    }
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
