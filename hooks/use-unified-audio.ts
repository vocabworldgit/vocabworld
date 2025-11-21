'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedAudioService, UnifiedAudioSettings, PlaybackStatus, AudioWord } from '@/lib/unified-audio';

export interface UseUnifiedAudioOptions {
  autoInitialize?: boolean;
  defaultSettings?: Partial<UnifiedAudioSettings>;
}

export interface UnifiedAudioHookReturn {
  // Audio service
  audioService: UnifiedAudioService | null;
  
  // Status
  playbackStatus: PlaybackStatus;
  isLoading: boolean;
  error: string | null;
  
  // Current data
  currentWords: AudioWord[];
  manifestInfo: any;
  
  // Settings
  settings: UnifiedAudioSettings;
  updateSettings: (newSettings: Partial<UnifiedAudioSettings>) => void;
  
  // Controls
  initializeTopic: (topicId: number) => Promise<boolean>;
  loadVocabulary: (vocabulary: any[]) => Promise<void>;
  playWord: (index: number) => Promise<void>;
  playAll: () => Promise<void>;
  stop: () => void;
  
  // Status helpers
  isPlaying: boolean;
  currentWordIndex: number;
  currentStep: 'training' | 'main' | 'pause' | 'idle';
  usingPreGenerated: boolean;
  hasAudioForTopic: boolean;
}

const defaultAudioSettings: UnifiedAudioSettings = {
  autoPlay: false,
  trainingLanguageVoice: 'Male',
  mainLanguageVoice: 'Male',
  pronunciationSpeed: 'Normal',
  pauseBetweenTranslations: 1,
  pauseForNextWord: 2,
  repeatTargetLanguage: 1,
  repeatMainLanguage: 1,
  preferPreGenerated: true,
  enableFallback: true,
};

export function useUnifiedAudio(options: UseUnifiedAudioOptions = {}): UnifiedAudioHookReturn {
  const [audioService, setAudioService] = useState<UnifiedAudioService | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>({
    isPlaying: false,
    currentWordIndex: -1,
    currentStep: 'idle',
    usingPreGenerated: false,
    totalWords: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWords, setCurrentWords] = useState<AudioWord[]>([]);
  const [manifestInfo, setManifestInfo] = useState<any>(null);
  const [settings, setSettings] = useState<UnifiedAudioSettings>({
    ...defaultAudioSettings,
    ...options.defaultSettings
  });
  
  const serviceRef = useRef<UnifiedAudioService | null>(null);
  
  // Initialize audio service
  useEffect(() => {
    if (typeof window !== 'undefined' && !serviceRef.current) {
      console.log('🎵 Initializing unified audio service');
      
      const service = new UnifiedAudioService();
      
      // Set up event handlers
      service.setEventHandlers({
        onPlaybackStatusChange: (status) => {
          console.log('📊 Playback status:', status);
          setPlaybackStatus(status);
        },
        onWordChange: (index, word) => {
          console.log(`🎵 Word changed: ${index + 1}. "${word.english_word}"`);
        },
        onComplete: () => {
          console.log('🎵 Playback completed');
          setError(null);
        }
      });
      
      serviceRef.current = service;
      setAudioService(service);
    }
  }, []);
  
  // Initialize topic
  const initializeTopic = useCallback(async (topicId: number): Promise<boolean> => {
    if (!serviceRef.current) {
      setError('Audio service not initialized');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🎵 Initializing topic ${topicId}`);
      
      const hasPreGenerated = await serviceRef.current.initializeTopic(topicId);
      
      // Update current data
      const words = serviceRef.current.getCurrentWords();
      const manifest = serviceRef.current.getManifestInfo();
      
      setCurrentWords(words);
      setManifestInfo(manifest);
      
      if (hasPreGenerated) {
        console.log(`✅ Pre-generated Umbriel audio loaded for topic ${topicId}`);
      } else {
        console.log(`ℹ️ No pre-generated audio for topic ${topicId}, fallback TTS available`);
      }
      
      return hasPreGenerated;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize topic';
      console.error('❌ Topic initialization failed:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load vocabulary (fallback)
  const loadVocabulary = useCallback(async (vocabulary: any[]): Promise<void> => {
    if (!serviceRef.current) {
      setError('Audio service not initialized');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`📚 Loading vocabulary: ${vocabulary.length} words`);
      
      await serviceRef.current.loadVocabulary(vocabulary);
      
      const words = serviceRef.current.getCurrentWords();
      setCurrentWords(words);
      
      console.log(`✅ Vocabulary loaded: ${words.length} words`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vocabulary';
      console.error('❌ Vocabulary loading failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Play specific word
  const playWord = useCallback(async (index: number): Promise<void> => {
    if (!serviceRef.current) {
      setError('Audio service not initialized');
      return;
    }
    
    setError(null);
    
    try {
      console.log(`🎵 Playing word ${index + 1}`);
      await serviceRef.current.playWordByIndex(index, settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play word';
      console.error('❌ Word playback failed:', errorMessage);
      setError(errorMessage);
    }
  }, [settings]);
  
  // Play all words
  const playAll = useCallback(async (): Promise<void> => {
    if (!serviceRef.current) {
      setError('Audio service not initialized');
      return;
    }
    
    setError(null);
    
    try {
      console.log('🎵 Playing all words');
      await serviceRef.current.playAllWords(settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play all words';
      console.error('❌ Auto-play failed:', errorMessage);
      setError(errorMessage);
    }
  }, [settings]);
  
  // Stop playback
  const stop = useCallback((): void => {
    if (serviceRef.current) {
      console.log('🛑 Stopping playback');
      serviceRef.current.stop();
    }
    setError(null);
  }, []);
  
  // Update settings
  const updateSettings = useCallback((newSettings: Partial<UnifiedAudioSettings>): void => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      console.log('⚙️ Audio settings updated:', newSettings);
      return updated;
    });
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.stop();
      }
    };
  }, []);
  
  return {
    // Audio service
    audioService,
    
    // Status
    playbackStatus,
    isLoading,
    error,
    
    // Current data
    currentWords,
    manifestInfo,
    
    // Settings
    settings,
    updateSettings,
    
    // Controls
    initializeTopic,
    loadVocabulary,
    playWord,
    playAll,
    stop,
    
    // Status helpers
    isPlaying: playbackStatus.isPlaying,
    currentWordIndex: playbackStatus.currentWordIndex,
    currentStep: playbackStatus.currentStep,
    usingPreGenerated: playbackStatus.usingPreGenerated,
    hasAudioForTopic: !!manifestInfo,
  };
}
