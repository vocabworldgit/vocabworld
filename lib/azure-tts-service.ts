import { AudioConfig, SpeechConfig, SpeechSynthesizer, SpeechSynthesisOutputFormat } from 'microsoft-cognitiveservices-speech-sdk';

export interface AzureVoice {
  voiceName: string;
  displayName: string;
  languageCode: string;
  locale: string;
  gender: 'Male' | 'Female';
  isNeural: boolean;
}

export interface AzureTTSOptions {
  languageCode: string;
  voiceName?: string;
  speed?: number; // 0.5 to 2.0
  pitch?: string; // 'x-low', 'low', 'medium', 'high', 'x-high'
  outputFormat?: SpeechSynthesisOutputFormat;
  gender?: 'Male' | 'Female';
}

export class AzureTTSService {
  private speechConfig: SpeechConfig | null = null;
  private speechKey: string;
  private region: string;
  private supportedLanguages: Map<string, AzureVoice[]> = new Map();

  constructor() {
    this.speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY || '';
    this.region = process.env.NEXT_PUBLIC_AZURE_REGION || 'eastus';
    
    if (!this.speechKey || !this.region) {
      console.error('❌ Azure Speech credentials not found in environment variables');
    } else {
      this.initializeService();
    }
  }

  private initializeService(): void {
    try {
      this.speechConfig = SpeechConfig.fromSubscription(this.speechKey, this.region);
      // Match Alnilam audio quality: closest to 22050Hz (using 24kHz) for consistency
      this.speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;
      
      // Enhanced audio quality settings
      this.speechConfig.setProperty("SpeechServiceResponse_Synthesis_WordBoundaryEnabled", "true");
      this.speechConfig.setProperty("SpeechServiceResponse_Synthesis_SentenceBoundaryEnabled", "true");
      
      console.log('✅ Azure TTS service initialized with Alnilam-compatible settings (24kHz MP3)');
    } catch (error) {
      console.error('❌ Failed to initialize Azure TTS service:', error);
    }
  }

  /**
   * Azure Speech supported languages and their typical voice mappings
   * Based on official Azure Speech documentation
   */
  private getAzureSupportedLanguages(): Map<string, AzureVoice[]> {
    const languages = new Map<string, AzureVoice[]>();

    // Azure supports these languages with neural voices
    const azureLanguageMapping: { [key: string]: AzureVoice[] } = {
      'af': [
        { voiceName: 'af-ZA-AdriNeural', displayName: 'Adri (Female)', languageCode: 'af', locale: 'af-ZA', gender: 'Female', isNeural: true },
        { voiceName: 'af-ZA-WillemNeural', displayName: 'Willem (Male)', languageCode: 'af', locale: 'af-ZA', gender: 'Male', isNeural: true }
      ],
      'am': [
        { voiceName: 'am-ET-AmehaNeural', displayName: 'Ameha (Male)', languageCode: 'am', locale: 'am-ET', gender: 'Male', isNeural: true },
        { voiceName: 'am-ET-MekdesNeural', displayName: 'Mekdes (Female)', languageCode: 'am', locale: 'am-ET', gender: 'Female', isNeural: true }
      ],
      'az': [
        { voiceName: 'az-AZ-BanuNeural', displayName: 'Banu (Female)', languageCode: 'az', locale: 'az-AZ', gender: 'Female', isNeural: true },
        { voiceName: 'az-AZ-BabakNeural', displayName: 'Babak (Male)', languageCode: 'az', locale: 'az-AZ', gender: 'Male', isNeural: true }
      ],
      'be': [
        { voiceName: 'be-BY-DariaNeural', displayName: 'Daria (Female)', languageCode: 'be', locale: 'be-BY', gender: 'Female', isNeural: true },
        { voiceName: 'be-BY-AntonNeural', displayName: 'Anton (Male)', languageCode: 'be', locale: 'be-BY', gender: 'Male', isNeural: true }
      ],
      'bg': [
        { voiceName: 'bg-BG-KalinaNeural', displayName: 'Kalina (Female)', languageCode: 'bg', locale: 'bg-BG', gender: 'Female', isNeural: true },
        { voiceName: 'bg-BG-BorislavNeural', displayName: 'Borislav (Male)', languageCode: 'bg', locale: 'bg-BG', gender: 'Male', isNeural: true }
      ],
      'bs': [
        { voiceName: 'bs-BA-VesnaNeural', displayName: 'Vesna (Female)', languageCode: 'bs', locale: 'bs-BA', gender: 'Female', isNeural: true },
        { voiceName: 'bs-BA-GoranNeural', displayName: 'Goran (Male)', languageCode: 'bs', locale: 'bs-BA', gender: 'Male', isNeural: true }
      ],
      'ca': [
        { voiceName: 'ca-ES-AlbaNeural', displayName: 'Alba (Female)', languageCode: 'ca', locale: 'ca-ES', gender: 'Female', isNeural: true },
        { voiceName: 'ca-ES-EnricNeural', displayName: 'Enric (Male)', languageCode: 'ca', locale: 'ca-ES', gender: 'Male', isNeural: true }
      ],
      'cs': [
        { voiceName: 'cs-CZ-VlastaNeural', displayName: 'Vlasta (Female)', languageCode: 'cs', locale: 'cs-CZ', gender: 'Female', isNeural: true },
        { voiceName: 'cs-CZ-AntoninNeural', displayName: 'Antonin (Male)', languageCode: 'cs', locale: 'cs-CZ', gender: 'Male', isNeural: true }
      ],
      'cy': [
        { voiceName: 'cy-GB-NiaNeural', displayName: 'Nia (Female)', languageCode: 'cy', locale: 'cy-GB', gender: 'Female', isNeural: true },
        { voiceName: 'cy-GB-AledNeural', displayName: 'Aled (Male)', languageCode: 'cy', locale: 'cy-GB', gender: 'Male', isNeural: true }
      ],
      'da': [
        { voiceName: 'da-DK-ChristelNeural', displayName: 'Christel (Female)', languageCode: 'da', locale: 'da-DK', gender: 'Female', isNeural: true },
        { voiceName: 'da-DK-JeppeNeural', displayName: 'Jeppe (Male)', languageCode: 'da', locale: 'da-DK', gender: 'Male', isNeural: true }
      ],
      'el': [
        { voiceName: 'el-GR-AthinaNeural', displayName: 'Athina (Female)', languageCode: 'el', locale: 'el-GR', gender: 'Female', isNeural: true },
        { voiceName: 'el-GR-NestorNeural', displayName: 'Nestor (Male)', languageCode: 'el', locale: 'el-GR', gender: 'Male', isNeural: true }
      ],
      'et': [
        { voiceName: 'et-EE-AnuNeural', displayName: 'Anu (Female)', languageCode: 'et', locale: 'et-EE', gender: 'Female', isNeural: true },
        { voiceName: 'et-EE-KertNeural', displayName: 'Kert (Male)', languageCode: 'et', locale: 'et-EE', gender: 'Male', isNeural: true }
      ],
      'eu': [
        { voiceName: 'eu-ES-AinhoaNeural', displayName: 'Ainhoa (Female)', languageCode: 'eu', locale: 'eu-ES', gender: 'Female', isNeural: true },
        { voiceName: 'eu-ES-AnderNeural', displayName: 'Ander (Male)', languageCode: 'eu', locale: 'eu-ES', gender: 'Male', isNeural: true }
      ],
      'fa': [
        { voiceName: 'fa-IR-DilaraNeural', displayName: 'Dilara (Female)', languageCode: 'fa', locale: 'fa-IR', gender: 'Female', isNeural: true },
        { voiceName: 'fa-IR-FaridNeural', displayName: 'Farid (Male)', languageCode: 'fa', locale: 'fa-IR', gender: 'Male', isNeural: true }
      ],
      'fi': [
        { voiceName: 'fi-FI-NooraNeural', displayName: 'Noora (Female)', languageCode: 'fi', locale: 'fi-FI', gender: 'Female', isNeural: true },
        { voiceName: 'fi-FI-HarriNeural', displayName: 'Harri (Male)', languageCode: 'fi', locale: 'fi-FI', gender: 'Male', isNeural: true }
      ],
      'ga': [
        { voiceName: 'ga-IE-OrlaNeural', displayName: 'Orla (Female)', languageCode: 'ga', locale: 'ga-IE', gender: 'Female', isNeural: true },
        { voiceName: 'ga-IE-ColmNeural', displayName: 'Colm (Male)', languageCode: 'ga', locale: 'ga-IE', gender: 'Male', isNeural: true }
      ],
      'gu': [
        { voiceName: 'gu-IN-DhwaniNeural', displayName: 'Dhwani (Female)', languageCode: 'gu', locale: 'gu-IN', gender: 'Female', isNeural: true },
        { voiceName: 'gu-IN-NiranjanNeural', displayName: 'Niranjan (Male)', languageCode: 'gu', locale: 'gu-IN', gender: 'Male', isNeural: true }
      ],
      'he': [
        { voiceName: 'he-IL-HilaNeural', displayName: 'Hila (Female)', languageCode: 'he', locale: 'he-IL', gender: 'Female', isNeural: true },
        { voiceName: 'he-IL-AvriNeural', displayName: 'Avri (Male)', languageCode: 'he', locale: 'he-IL', gender: 'Male', isNeural: true }
      ],
      'hr': [
        { voiceName: 'hr-HR-GabrijelaNeural', displayName: 'Gabrijela (Female)', languageCode: 'hr', locale: 'hr-HR', gender: 'Female', isNeural: true },
        { voiceName: 'hr-HR-SreckoNeural', displayName: 'Srecko (Male)', languageCode: 'hr', locale: 'hr-HR', gender: 'Male', isNeural: true }
      ],
      'hu': [
        { voiceName: 'hu-HU-NoemiNeural', displayName: 'Noemi (Female)', languageCode: 'hu', locale: 'hu-HU', gender: 'Female', isNeural: true },
        { voiceName: 'hu-HU-TamasNeural', displayName: 'Tamas (Male)', languageCode: 'hu', locale: 'hu-HU', gender: 'Male', isNeural: true }
      ],
      'is': [
        { voiceName: 'is-IS-GudrunNeural', displayName: 'Gudrun (Female)', languageCode: 'is', locale: 'is-IS', gender: 'Female', isNeural: true },
        { voiceName: 'is-IS-GunnarNeural', displayName: 'Gunnar (Male)', languageCode: 'is', locale: 'is-IS', gender: 'Male', isNeural: true }
      ],
      'ka': [
        { voiceName: 'ka-GE-EkaNeural', displayName: 'Eka (Female)', languageCode: 'ka', locale: 'ka-GE', gender: 'Female', isNeural: true },
        { voiceName: 'ka-GE-GiorgiNeural', displayName: 'Giorgi (Male)', languageCode: 'ka', locale: 'ka-GE', gender: 'Male', isNeural: true }
      ],
      'kk': [
        { voiceName: 'kk-KZ-AigulNeural', displayName: 'Aigul (Female)', languageCode: 'kk', locale: 'kk-KZ', gender: 'Female', isNeural: true },
        { voiceName: 'kk-KZ-DauletNeural', displayName: 'Daulet (Male)', languageCode: 'kk', locale: 'kk-KZ', gender: 'Male', isNeural: true }
      ],
      'km': [
        { voiceName: 'km-KH-SreymomNeural', displayName: 'Sreymom (Female)', languageCode: 'km', locale: 'km-KH', gender: 'Female', isNeural: true },
        { voiceName: 'km-KH-PisachNeural', displayName: 'Pisach (Male)', languageCode: 'km', locale: 'km-KH', gender: 'Male', isNeural: true }
      ],
      'kn': [
        { voiceName: 'kn-IN-SapnaNeural', displayName: 'Sapna (Female)', languageCode: 'kn', locale: 'kn-IN', gender: 'Female', isNeural: true },
        { voiceName: 'kn-IN-GaganNeural', displayName: 'Gagan (Male)', languageCode: 'kn', locale: 'kn-IN', gender: 'Male', isNeural: true }
      ],
      'ky': [
        { voiceName: 'ky-KG-AisuluNeural', displayName: 'Aisulu (Female)', languageCode: 'ky', locale: 'ky-KG', gender: 'Female', isNeural: true },
        { voiceName: 'ky-KG-AzamatNeural', displayName: 'Azamat (Male)', languageCode: 'ky', locale: 'ky-KG', gender: 'Male', isNeural: true }
      ],
      'lo': [
        { voiceName: 'lo-LA-KeomanyNeural', displayName: 'Keomany (Female)', languageCode: 'lo', locale: 'lo-LA', gender: 'Female', isNeural: true },
        { voiceName: 'lo-LA-ChanthavongNeural', displayName: 'Chanthavong (Male)', languageCode: 'lo', locale: 'lo-LA', gender: 'Male', isNeural: true }
      ],
      'lt': [
        { voiceName: 'lt-LT-OnaNeural', displayName: 'Ona (Female)', languageCode: 'lt', locale: 'lt-LT', gender: 'Female', isNeural: true },
        { voiceName: 'lt-LT-LeonasNeural', displayName: 'Leonas (Male)', languageCode: 'lt', locale: 'lt-LT', gender: 'Male', isNeural: true }
      ],
      'lv': [
        { voiceName: 'lv-LV-EveritaNeural', displayName: 'Everita (Female)', languageCode: 'lv', locale: 'lv-LV', gender: 'Female', isNeural: true },
        { voiceName: 'lv-LV-NilsNeural', displayName: 'Nils (Male)', languageCode: 'lv', locale: 'lv-LV', gender: 'Male', isNeural: true }
      ],
      'mk': [
        { voiceName: 'mk-MK-MarijaNeural', displayName: 'Marija (Female)', languageCode: 'mk', locale: 'mk-MK', gender: 'Female', isNeural: true },
        { voiceName: 'mk-MK-AleksandarNeural', displayName: 'Aleksandar (Male)', languageCode: 'mk', locale: 'mk-MK', gender: 'Male', isNeural: true }
      ],
      'ml': [
        { voiceName: 'ml-IN-SobhanaNeural', displayName: 'Sobhana (Female)', languageCode: 'ml', locale: 'ml-IN', gender: 'Female', isNeural: true },
        { voiceName: 'ml-IN-MidhunNeural', displayName: 'Midhun (Male)', languageCode: 'ml', locale: 'ml-IN', gender: 'Male', isNeural: true }
      ],
      'mn': [
        { voiceName: 'mn-MN-YesuiNeural', displayName: 'Yesui (Female)', languageCode: 'mn', locale: 'mn-MN', gender: 'Female', isNeural: true },
        { voiceName: 'mn-MN-BatbayarNeural', displayName: 'Batbayar (Male)', languageCode: 'mn', locale: 'mn-MN', gender: 'Male', isNeural: true }
      ],
      'ms': [
        { voiceName: 'ms-MY-YasminNeural', displayName: 'Yasmin (Female)', languageCode: 'ms', locale: 'ms-MY', gender: 'Female', isNeural: true },
        { voiceName: 'ms-MY-OsmanNeural', displayName: 'Osman (Male)', languageCode: 'ms', locale: 'ms-MY', gender: 'Male', isNeural: true }
      ],
      'mt': [
        { voiceName: 'mt-MT-GraceNeural', displayName: 'Grace (Female)', languageCode: 'mt', locale: 'mt-MT', gender: 'Female', isNeural: true },
        { voiceName: 'mt-MT-JosephNeural', displayName: 'Joseph (Male)', languageCode: 'mt', locale: 'mt-MT', gender: 'Male', isNeural: true }
      ],
      'my': [
        { voiceName: 'my-MM-NilarNeural', displayName: 'Nilar (Female)', languageCode: 'my', locale: 'my-MM', gender: 'Female', isNeural: true },
        { voiceName: 'my-MM-ThihaNeural', displayName: 'Thiha (Male)', languageCode: 'my', locale: 'my-MM', gender: 'Male', isNeural: true }
      ],
      'ne': [
        { voiceName: 'ne-NP-HemkalaNeural', displayName: 'Hemkala (Female)', languageCode: 'ne', locale: 'ne-NP', gender: 'Female', isNeural: true },
        { voiceName: 'ne-NP-SagarNeural', displayName: 'Sagar (Male)', languageCode: 'ne', locale: 'ne-NP', gender: 'Male', isNeural: true }
      ],
      'no': [
        { voiceName: 'nb-NO-PernilleNeural', displayName: 'Pernille (Female)', languageCode: 'no', locale: 'nb-NO', gender: 'Female', isNeural: true },
        { voiceName: 'nb-NO-FinnNeural', displayName: 'Finn (Male)', languageCode: 'no', locale: 'nb-NO', gender: 'Male', isNeural: true }
      ],
      'ps': [
        { voiceName: 'ps-AF-LatifaNeural', displayName: 'Latifa (Female)', languageCode: 'ps', locale: 'ps-AF', gender: 'Female', isNeural: true },
        { voiceName: 'ps-AF-GulNawazNeural', displayName: 'GulNawaz (Male)', languageCode: 'ps', locale: 'ps-AF', gender: 'Male', isNeural: true }
      ],
      'si': [
        { voiceName: 'si-LK-ThiliniNeural', displayName: 'Thilini (Female)', languageCode: 'si', locale: 'si-LK', gender: 'Female', isNeural: true },
        { voiceName: 'si-LK-SameeraNeural', displayName: 'Sameera (Male)', languageCode: 'si', locale: 'si-LK', gender: 'Male', isNeural: true }
      ],
      'sk': [
        { voiceName: 'sk-SK-ViktoriaNeural', displayName: 'Viktoria (Female)', languageCode: 'sk', locale: 'sk-SK', gender: 'Female', isNeural: true },
        { voiceName: 'sk-SK-LukasNeural', displayName: 'Lukas (Male)', languageCode: 'sk', locale: 'sk-SK', gender: 'Male', isNeural: true }
      ],
      'sl': [
        { voiceName: 'sl-SI-PetraNeural', displayName: 'Petra (Female)', languageCode: 'sl', locale: 'sl-SI', gender: 'Female', isNeural: true },
        { voiceName: 'sl-SI-RokNeural', displayName: 'Rok (Male)', languageCode: 'sl', locale: 'sl-SI', gender: 'Male', isNeural: true }
      ],
      'sq': [
        { voiceName: 'sq-AL-AnilaNeural', displayName: 'Anila (Female)', languageCode: 'sq', locale: 'sq-AL', gender: 'Female', isNeural: true },
        { voiceName: 'sq-AL-IlirNeural', displayName: 'Ilir (Male)', languageCode: 'sq', locale: 'sq-AL', gender: 'Male', isNeural: true }
      ],
      'sr': [
        { voiceName: 'sr-RS-SophieNeural', displayName: 'Sophie (Female)', languageCode: 'sr', locale: 'sr-RS', gender: 'Female', isNeural: true },
        { voiceName: 'sr-RS-NicholasNeural', displayName: 'Nicholas (Male)', languageCode: 'sr', locale: 'sr-RS', gender: 'Male', isNeural: true }
      ],
      'sv': [
        { voiceName: 'sv-SE-SofieNeural', displayName: 'Sofie (Female)', languageCode: 'sv', locale: 'sv-SE', gender: 'Female', isNeural: true },
        { voiceName: 'sv-SE-MattiasNeural', displayName: 'Mattias (Male)', languageCode: 'sv', locale: 'sv-SE', gender: 'Male', isNeural: true }
      ],
      'sw': [
        { voiceName: 'sw-TZ-RehemaNeural', displayName: 'Rehema (Female)', languageCode: 'sw', locale: 'sw-TZ', gender: 'Female', isNeural: true },
        { voiceName: 'sw-TZ-DaudiNeural', displayName: 'Daudi (Male)', languageCode: 'sw', locale: 'sw-TZ', gender: 'Male', isNeural: true }
      ],
      'tg': [
        { voiceName: 'tg-TJ-HulkarNeural', displayName: 'Hulkar (Female)', languageCode: 'tg', locale: 'tg-TJ', gender: 'Female', isNeural: true },
        { voiceName: 'tg-TJ-AbdurahmonNeural', displayName: 'Abdurahmon (Male)', languageCode: 'tg', locale: 'tg-TJ', gender: 'Male', isNeural: true }
      ],
      'tk': [
        { voiceName: 'tk-TM-SindorNeural', displayName: 'Sindor (Female)', languageCode: 'tk', locale: 'tk-TM', gender: 'Female', isNeural: true },
        { voiceName: 'tk-TM-AbidurahmanNeural', displayName: 'Abidurahman (Male)', languageCode: 'tk', locale: 'tk-TM', gender: 'Male', isNeural: true }
      ],
      'ur': [
        { voiceName: 'ur-PK-UzmaNeural', displayName: 'Uzma (Female)', languageCode: 'ur', locale: 'ur-PK', gender: 'Female', isNeural: true },
        { voiceName: 'ur-PK-AsadNeural', displayName: 'Asad (Male)', languageCode: 'ur', locale: 'ur-PK', gender: 'Male', isNeural: true }
      ],
      'uz': [
        { voiceName: 'uz-UZ-MadinaNeural', displayName: 'Madina (Female)', languageCode: 'uz', locale: 'uz-UZ', gender: 'Female', isNeural: true },
        { voiceName: 'uz-UZ-SardorNeural', displayName: 'Sardor (Male)', languageCode: 'uz', locale: 'uz-UZ', gender: 'Male', isNeural: true }
      ],
      'zh': [
        { voiceName: 'zh-CN-XiaoxiaoNeural', displayName: 'Xiaoxiao (Female)', languageCode: 'zh', locale: 'zh-CN', gender: 'Female', isNeural: true },
        { voiceName: 'zh-CN-YunxiNeural', displayName: 'Yunxi (Male)', languageCode: 'zh', locale: 'zh-CN', gender: 'Male', isNeural: true }
      ]
    };

    // Convert to Map
    Object.entries(azureLanguageMapping).forEach(([code, voices]) => {
      languages.set(code, voices);
    });

    return languages;
  }

  /**
   * Get languages that Azure supports but aren't in your alnilam library
   */
  public getAvailableLanguagesForTTS(): { supported: string[], unsupported: string[] } {
    const languagesWithoutAlnilam = [
      'af', 'am', 'az', 'be', 'bg', 'br', 'bs', 'ca', 'co', 'cs', 'cy', 'da', 'el', 'eo', 'et',
      'eu', 'fa', 'fi', 'fo', 'ga', 'gd', 'gu', 'ha', 'he', 'hr', 'hu', 'ig', 'is', 'jv', 'ka',
      'kk', 'km', 'kn', 'ky', 'la', 'lb', 'lo', 'lt', 'lv', 'mg', 'mk', 'ml', 'mn', 'ms', 'mt',
      'my', 'ne', 'no', 'or', 'pa', 'ps', 'rw', 'sa', 'si', 'sk', 'sl', 'sn', 'so', 'sq', 'sr',
      'sv', 'sw', 'tg', 'tk', 'tl', 'ur', 'uz', 'xh', 'yo', 'zh', 'zu'
    ];

    this.supportedLanguages = this.getAzureSupportedLanguages();
    
    const supported = languagesWithoutAlnilam.filter(lang => this.supportedLanguages.has(lang));
    const unsupported = languagesWithoutAlnilam.filter(lang => !this.supportedLanguages.has(lang));

    return { supported, unsupported };
  }

  /**
   * Generate SSML for natural pronunciation matching Alnilam style
   */
  private generateSSML(text: string, voice: AzureVoice, options: AzureTTSOptions): string {
    const speed = options.speed || 1.0; // Natural conversational pace (matches Alnilam)
    const pitch = options.pitch || 'medium'; // Neutral pitch (matches Alnilam)
    
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
             xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${voice.locale}">
        <voice name="${voice.voiceName}">
          <mstts:express-as style="calm" styledegree="0.8">
            <prosody rate="${speed}" pitch="${pitch}" volume="default">
              ${text}
            </prosody>
          </mstts:express-as>
        </voice>
      </speak>
    `.trim();
  }

  /**
   * Generate high-quality TTS audio file
   */
  public async generateTTSAudio(
    text: string, 
    languageCode: string, 
    options: Partial<AzureTTSOptions> = {}
  ): Promise<ArrayBuffer | null> {
    if (!this.speechConfig) {
      console.error('❌ Azure Speech config not initialized');
      return null;
    }

    try {
      const voices = this.supportedLanguages.get(languageCode);
      if (!voices || voices.length === 0) {
        console.error(`❌ No voices found for language: ${languageCode}`);
        return null;
      }

      // Select voice based on gender preference or default to first female voice
      const preferredGender = options.gender || 'Female';
      const selectedVoice = voices.find(v => v.gender === preferredGender) || voices[0];

      console.log(`🎤 Using Azure voice: ${selectedVoice.displayName} for ${languageCode}`);

      // Create audio config for in-memory audio capture (not speaker output)
      const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new SpeechSynthesizer(this.speechConfig, audioConfig);

      // Generate SSML with professional settings
      const ssml = this.generateSSML(text, selectedVoice, {
        languageCode,
        speed: options.speed || 1.0,
        pitch: options.pitch || 'medium',
        ...options
      });

      console.log(`🔊 Generating TTS for: "${text}" in ${languageCode}`);
      console.log(`🎵 SSML: ${ssml}`);

      return new Promise((resolve, reject) => {
        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            console.log(`🔍 Synthesis result:`, result);
            console.log(`🔍 Result reason:`, result.reason);
            console.log(`🔍 Audio data length:`, result.audioData ? result.audioData.byteLength : 'null');
            
            if (result.audioData && result.audioData.byteLength > 0) {
              console.log(`✅ TTS generated successfully for ${languageCode} (${result.audioData.byteLength} bytes)`);
              resolve(result.audioData);
            } else {
              console.error(`❌ No audio data received for ${languageCode}`);
              console.error(`❌ Result details:`, {
                reason: result.reason,
                errorDetails: result.errorDetails,
                audioDataLength: result.audioData ? result.audioData.byteLength : 'null'
              });
              resolve(null);
            }
            synthesizer.close();
          },
          (error) => {
            console.error(`❌ TTS generation failed for ${languageCode}:`, error);
            synthesizer.close();
            reject(error);
          }
        );
      });

    } catch (error) {
      console.error(`❌ Error generating TTS for ${languageCode}:`, error);
      return null;
    }
  }

  /**
   * Generate test batch of TTS files for specified languages
   */
  public async generateTestBatch(
    testWords: string[] = ['hello', 'goodbye', 'thank you', 'please', 'yes'],
    languageCodes: string[] = [],
    outputDir: string = './public/audio/azure-test'
  ): Promise<{ success: string[], failed: string[] }> {
    const { supported } = this.getAvailableLanguagesForTTS();
    const languagesToTest = languageCodes.length > 0 ? languageCodes : supported.slice(0, 10); // Test first 10 if no specific list

    console.log(`🧪 Starting Azure TTS test batch for ${languagesToTest.length} languages`);
    console.log(`📝 Test words: ${testWords.join(', ')}`);

    const success: string[] = [];
    const failed: string[] = [];

    for (const langCode of languagesToTest) {
      console.log(`\n🌍 Testing language: ${langCode}`);
      
      try {
        let langSuccess = true;
        
        for (const word of testWords) {
          const audioBuffer = await this.generateTTSAudio(word, langCode, {
            gender: 'Female', // Use neutral female voice
            speed: 1.0, // Normal speed
            pitch: 'medium' // Neutral pitch
          });

          if (audioBuffer) {
            // In a real implementation, you would save this to a file
            console.log(`  ✅ Generated "${word}" in ${langCode}`);
          } else {
            console.log(`  ❌ Failed to generate "${word}" in ${langCode}`);
            langSuccess = false;
          }
        }

        if (langSuccess) {
          success.push(langCode);
          console.log(`✅ ${langCode} - ALL WORDS GENERATED SUCCESSFULLY`);
        } else {
          failed.push(langCode);
          console.log(`❌ ${langCode} - SOME WORDS FAILED`);
        }

      } catch (error) {
        console.error(`❌ ${langCode} - ERROR:`, error);
        failed.push(langCode);
      }
    }

    console.log(`\n📊 Test batch completed:`);
    console.log(`✅ Successful languages (${success.length}): ${success.join(', ')}`);
    console.log(`❌ Failed languages (${failed.length}): ${failed.join(', ')}`);

    return { success, failed };
  }

  /**
   * Get voice information for a language
   */
  public getVoicesForLanguage(languageCode: string): AzureVoice[] {
    return this.supportedLanguages.get(languageCode) || [];
  }

  /**
   * Check if service is available
   */
  public isAvailable(): boolean {
    return !!this.speechConfig && !!this.speechKey && !!this.region;
  }

  /**
   * Get service status
   */
  public getStatus(): { available: boolean, language_count: number, error?: string } {
    if (!this.isAvailable()) {
      return {
        available: false,
        language_count: 0,
        error: 'Azure credentials not configured'
      };
    }

    const { supported } = this.getAvailableLanguagesForTTS();
    return {
      available: true,
      language_count: supported.length
    };
  }
}

// Export singleton instance
export const azureTTSService = new AzureTTSService();
