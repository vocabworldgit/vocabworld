// Backblaze B2 Audio Service for VocaBy
// Handles audio file serving from B2 cloud storage

interface AudioFile {
  wordId: string;
  filename: string;
  languageCode: string;
  category: string;
  url: string;
}

interface B2AudioCache {
  [key: string]: string; // wordId-languageCode -> URL
}

class B2AudioService {
  private static instance: B2AudioService;
  private cache: B2AudioCache = {};
  private audioMap: Map<string, AudioFile> = new Map();
  private initialized = false;

  // B2 Configuration
  private readonly B2_BUCKET_NAME = 'voco-audio-library';
  private readonly B2_DOWNLOAD_URL = 'https://f002.backblazeb2.com/file/voco-audio-library';

  private constructor() {}

  static getInstance(): B2AudioService {
    if (!B2AudioService.instance) {
      B2AudioService.instance = new B2AudioService();
    }
    return B2AudioService.instance;
  }

  // Initialize the service by loading the audio mapping
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔧 Initializing B2 Audio Service...');
      
      // Load the audio mapping from the CSV file
      await this.loadAudioMapping();
      
      this.initialized = true;
      console.log(`✅ B2 Audio Service initialized with ${this.audioMap.size} audio files`);
    } catch (error) {
      console.error('❌ Failed to initialize B2 Audio Service:', error);
      throw error;
    }
  }

  // Load audio file mapping from the CSV
  private async loadAudioMapping(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const csvPath = path.join(process.cwd(), 'backblaze-urls-20250909-180354.csv');
      
      console.log(`🔍 Looking for CSV at: ${csvPath}`);
      
      if (!fs.existsSync(csvPath)) {
        console.warn('⚠️ Audio mapping CSV not found, using direct URL construction');
        console.log('📁 Current working directory:', process.cwd());
        
        return;
      }

      console.log('✅ Found CSV file, loading...');
      this.loadFromPath(csvPath, fs);

    } catch (error) {
      console.error('❌ Error loading audio mapping:', error);
      // Don't throw - we can fall back to direct URL construction
    }
  }

  private loadFromPath(csvPath: string, fs: any): void {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    console.log(`📊 Processing ${lines.length} CSV lines...`);

    let successCount = 0;
    let failCount = 0;

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse CSV line (handling quoted values)
      const match = line.match(/^"([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)"$/);
      if (!match) {
        failCount++;
        if (failCount < 5) { // Show first few failures for debugging
          console.log(`⚠️ Failed to parse line: ${line.substring(0, 100)}...`);
        }
        continue;
      }

      const [, localPath, backblazeURL, language, category, fileName] = match;
      
      // Extract wordId from filename (pattern: alnilam_{wordId}_*.wav)
      const wordIdMatch = fileName.match(/alnilam_(\d+)_/);
      if (!wordIdMatch) {
        failCount++;
        continue;
      }

      const wordId = wordIdMatch[1];
      const key = `${wordId}-${language}`;
      
      this.audioMap.set(key, {
        wordId,
        filename: fileName,
        languageCode: language,
        category,
        url: backblazeURL
      });

      // Cache the URL for quick lookup
      this.cache[key] = backblazeURL;
      successCount++;
    }

    console.log(`📊 CSV Processing complete:`);
    console.log(`  ✅ Successfully loaded: ${successCount} audio files`);
    console.log(`  ❌ Failed to parse: ${failCount} lines`);
    
    // Show sample entries for debugging
    console.log(`🔍 Sample entries loaded:`);
    let sampleCount = 0;
    for (const [key, audioFile] of this.audioMap) {
      if (sampleCount < 5) {
        console.log(`  ${key}: ${audioFile.filename} -> ${audioFile.url}`);
        sampleCount++;
      } else {
        break;
      }
    }
  }

  // Get audio URL for a specific word and language
  async getAudioUrl(wordId: string, languageCode: string): Promise<string | null> {
    await this.initialize();

    const key = `${wordId}-${languageCode}`;
    
    // Check cache first
    if (this.cache[key]) {
      console.log(`✅ Found cached audio URL for wordId=${wordId}, language=${languageCode}`);
      return this.cache[key];
    }

    // If not in cache, try to construct URL based on existing patterns
    console.log(`🔍 Audio not found in cache for wordId=${wordId}, language=${languageCode}`);
    console.log(`🔍 Available keys in cache (first 10):`, Object.keys(this.cache).slice(0, 10));
    return null;
  }

  // Get audio file info
  async getAudioInfo(wordId: string, languageCode: string): Promise<AudioFile | null> {
    await this.initialize();

    const key = `${wordId}-${languageCode}`;
    return this.audioMap.get(key) || null;
  }

  // Check if audio exists for word/language combination
  async hasAudio(wordId: string, languageCode: string): Promise<boolean> {
    await this.initialize();

    const key = `${wordId}-${languageCode}`;
    return this.cache.hasOwnProperty(key);
  }

  // Get all available languages for a specific word
  async getAvailableLanguages(wordId: string): Promise<string[]> {
    await this.initialize();

    const languages: string[] = [];
    for (const [key, audioFile] of this.audioMap) {
      if (audioFile.wordId === wordId) {
        languages.push(audioFile.languageCode);
      }
    }

    return [...new Set(languages)]; // Remove duplicates
  }

  // Fetch audio buffer from B2 (for serving)
  async fetchAudioBuffer(url: string): Promise<Buffer> {
    try {
      console.log(`🌐 Fetching audio from B2: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`✅ Successfully fetched audio: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error(`❌ Failed to fetch audio from ${url}:`, error);
      throw error;
    }
  }

  // Get service statistics
  getStats(): { totalFiles: number; languages: string[]; categories: string[] } {
    const languages = new Set<string>();
    const categories = new Set<string>();

    for (const audioFile of this.audioMap.values()) {
      languages.add(audioFile.languageCode);
      categories.add(audioFile.category);
    }

    return {
      totalFiles: this.audioMap.size,
      languages: Array.from(languages).sort(),
      categories: Array.from(categories).sort()
    };
  }
}

export default B2AudioService;