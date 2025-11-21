"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Language, Topic, VocabularyWord, VocabularyResponse, getLanguages, getTopics, getVocabularyForTopic } from "@/lib/database"
import { useUnifiedAudio } from "@/hooks/use-unified-audio"
import {
  Search,
  Languages,
  MessageCircle,
  Calculator,
  Clock,
  Sun,
  AlertTriangle,
  Users,
  Heart,
  User,
  Activity,
  Briefcase,
  Globe,
  UtensilsCrossed,
  ChefHat,
  Home,
  ShoppingCart,
  Shirt,
  Wrench,
  Smartphone,
  MapPin,
  Car,
  Gamepad2,
  Palette,
  Wifi,
  Shapes,
  Leaf,
  Dog,
  Cloud,
  GraduationCap,
  Rocket,
  BookOpen,
  Church,
  Scale,
  Shield,
  Sparkles,
  Radio,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  Settings,
  ArrowLeft,
  Mic,
  Volume2,
} from "lucide-react"

// Topic icon mapping for our new 39 topics
const TOPIC_ICONS = [
  { id: 1, icon: MessageCircle }, // Greetings
  { id: 2, icon: Calculator }, // Numbers
  { id: 3, icon: Clock }, // Time & Dates
  { id: 4, icon: AlertTriangle }, // Emergency & Safety
  { id: 5, icon: ShoppingCart }, // Shopping & Money
  { id: 6, icon: UtensilsCrossed }, // Food, Drinks & Restaurants
  { id: 7, icon: MapPin }, // Directions & Transportation
  { id: 8, icon: Heart }, // Health & Body Parts
  { id: 9, icon: Home }, // Home & Household Items
  { id: 10, icon: Shirt }, // Clothing & Personal Style
  { id: 11, icon: Sun }, // Weather & Seasons
  { id: 12, icon: Users }, // Family & Relationships
  { id: 13, icon: Heart }, // Emotions & Feelings
  { id: 14, icon: User }, // Personality & Character
  { id: 15, icon: Activity }, // Hobbies & Leisure Activities
  { id: 16, icon: Gamepad2 }, // Sports & Fitness
  { id: 17, icon: MapPin }, // Places Around Town
  { id: 18, icon: Car }, // Travel & Tourism
  { id: 19, icon: Shapes }, // Colors & Shapes
  { id: 20, icon: Leaf }, // Nature
  { id: 21, icon: Activity }, // Actions
  { id: 22, icon: BookOpen }, // Adjectives
  { id: 23, icon: Palette }, // Arts & Entertainment
  { id: 24, icon: Smartphone }, // Technology & Gadgets
  { id: 25, icon: Briefcase }, // Work & Professions
  { id: 26, icon: GraduationCap }, // Education & Learning
  { id: 27, icon: Rocket }, // Science & Innovation
  { id: 28, icon: Church }, // Religion & Spirituality
  { id: 29, icon: Scale }, // Law & Government
  { id: 30, icon: Shield }, // Military & Security
  { id: 31, icon: Sparkles }, // Celebrations & Events
  { id: 32, icon: Radio }, // Communication & Media
  { id: 33, icon: PartyPopper }, // Entertainment & Fun
  { id: 34, icon: Languages }, // Language & Literature
  { id: 35, icon: Globe }, // History & Culture
  { id: 36, icon: Dog }, // Animals & Pets
  { id: 37, icon: Gamepad2 }, // Games & Puzzles
  { id: 38, icon: Activity }, // Exercise & Movement
  { id: 39, icon: Leaf }, // Environmental Issues
]

export default function EnhancedLanguageSelector() {
  const [currentPage, setCurrentPage] = useState<"language" | "topic" | "vocabulary" | "confirmation">("language")
  const [languages, setLanguages] = useState<Language[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([])
  const [targetLanguage, setTargetLanguage] = useState<string>("")
  const [nativeLanguage, setNativeLanguage] = useState<string>("")
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState(false)
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([])

  // Unified audio service
  const unifiedAudio = useUnifiedAudio({
    defaultSettings: {
      autoPlay: true,
      trainingLanguageVoice: 'Male',
      mainLanguageVoice: 'Male',
      pronunciationSpeed: 'Normal',
      pauseBetweenTranslations: 1,
      pauseForNextWord: 2,
      repeatTargetLanguage: 1,
      repeatMainLanguage: 1,
      preferPreGenerated: true,
      enableFallback: true,
    }
  })

  // Load languages on component mount
  useEffect(() => {
    async function loadLanguages() {
      try {
        const langs = await getLanguages()
        
        // All 50 languages from Alnilam Audio Library - matching available audio files
        const alnilamLanguageCodes = ['ar', 'bg', 'bn', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en', 'es', 'et', 'eu', 'fa', 'fi', 'fr', 'ga', 'gu', 'he', 'hi', 'hr', 'hu', 'id', 'is', 'it', 'ja', 'ko', 'lt', 'lv', 'mk', 'ml', 'mr', 'mt', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sv', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'vi', 'zh']
        
        // Filter to show only the 50 languages with audio files
        const alnilamLanguages = langs.filter(lang => alnilamLanguageCodes.includes(lang.code))
        
        setLanguages(alnilamLanguages)
      } catch (error) {
        console.error("Failed to load languages:", error)
      }
    }
    loadLanguages()
  }, [])

  // Load topics when languages are selected
  useEffect(() => {
    async function loadTopics() {
      if (targetLanguage && nativeLanguage) {
        try {
          const topicsData = await getTopics()
          setTopics(topicsData)
          setFilteredTopics(topicsData)
        } catch (error) {
          console.error("Failed to load topics:", error)
        }
      }
    }
    loadTopics()
  }, [targetLanguage, nativeLanguage])

  // Filter topics based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTopics(topics)
    } else {
      const filtered = topics.filter(topic =>
        topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredTopics(filtered)
    }
  }, [searchQuery, topics])

  // Load vocabulary for selected topic
  const loadVocabulary = async (topic: Topic) => {
    setIsLoadingVocabulary(true)
    setSelectedTopic(topic)
    setCurrentWordIndex(0)

    try {
      console.log(`🎵 Loading vocabulary for topic: ${topic.name}`)
      
      const response: VocabularyResponse = await getVocabularyForTopic(
        topic.id,
        targetLanguage,
        nativeLanguage
      )

      if (response.success && response.vocabulary) {
        const vocabWords = response.vocabulary.map(word => ({
          sourceWord: word.english_word || word.sourceWord || '',
          targetWord: word.turkish_word || word.targetWord || '',
          confidenceScore: word.confidenceScore || 0,
          context: word.context || '',
          partOfSpeech: word.partOfSpeech,
          difficultyLevel: word.difficultyLevel,
          exampleSentence: word.exampleSentence,
          learningOrder: word.learning_order || word.learningOrder || 0,
        }))

        setVocabulary(vocabWords)
        
        // Try to initialize with pre-generated Umbriel audio
        console.log(`🎵 Attempting to load Umbriel voice for topic ${topic.id}`)
        const hasUmbrielAudio = await unifiedAudio.initializeTopic(topic.id)
        
        if (hasUmbrielAudio) {
          console.log(`✅ Umbriel's teaching voice loaded for ${topic.name}!`)
          const manifestInfo = unifiedAudio.manifestInfo
          if (manifestInfo) {
            console.log(`📊 Audio Quality: ${manifestInfo.audio_config.quality}`)
            console.log(`🎤 Voice: ${manifestInfo.audio_config.voice}`)
            console.log(`📈 Success Rate: ${manifestInfo.statistics.success_rate}%`)
          }
        } else {
          // Load vocabulary for fallback TTS
          console.log(`🔄 Loading fallback TTS for ${topic.name}`)
          await unifiedAudio.loadVocabulary(vocabWords)
        }

        setCurrentPage("vocabulary")
      } else {
        console.error("Failed to load vocabulary:", response.error)
      }
    } catch (error) {
      console.error("Error loading vocabulary:", error)
    } finally {
      setIsLoadingVocabulary(false)
    }
  }

  // Handle play button click
  const handlePlay = async () => {
    if (unifiedAudio.isPlaying) {
      console.log('🛑 Stopping audio playback')
      unifiedAudio.stop()
    } else {
      console.log('🎵 Starting audio playback')
      
      if (unifiedAudio.settings.autoPlay) {
        // Auto-play all words from current position
        await unifiedAudio.playAll()
      } else {
        // Play just the current word
        await unifiedAudio.playWord(currentWordIndex)
      }
    }
  }

  // Navigate to previous word
  const goToPreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
    }
  }

  // Navigate to next word
  const goToNextWord = () => {
    if (currentWordIndex < vocabulary.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
    }
  }

  // Get icon component for topic
  const getTopicIcon = (topicId: number) => {
    const iconData = TOPIC_ICONS.find(item => item.id === topicId)
    return iconData ? iconData.icon : MessageCircle
  }

  // Audio status display component
  const AudioStatusDisplay = () => {
    const { currentStep, usingPreGenerated, hasAudioForTopic } = unifiedAudio
    
    if (unifiedAudio.isPlaying) {
      const stepText = {
        'training': 'Learning Language',
        'main': 'Native Language', 
        'pause': 'Pause',
        'idle': 'Ready'
      }[currentStep]
      
      return (
        <div className="flex items-center gap-2 text-sm">
          <Volume2 className="h-4 w-4 animate-pulse text-blue-500" />
          <span className="text-blue-600">
            {stepText} {usingPreGenerated && '• Umbriel Voice'}
          </span>
        </div>
      )
    }
    
    if (hasAudioForTopic) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Mic className="h-4 w-4" />
          <span>Umbriel Teaching Voice Available</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Volume2 className="h-4 w-4" />
        <span>Browser TTS Available</span>
      </div>
    )
  }

  // Language selection page
  if (currentPage === "language") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Voco</h1>
            <p className="text-white/80">Choose your languages to start learning</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">
                What language do you want to learn?
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30"
              >
                <option value="">Select learning language</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                What is your native language?
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30"
              >
                <option value="">Select native language</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => setCurrentPage("topic")}
              disabled={!targetLanguage || !nativeLanguage}
              className="w-full bg-white text-purple-600 hover:bg-white/90"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Topic selection page
  if (currentPage === "topic") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setCurrentPage("language")}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Languages
            </Button>
            <h1 className="text-2xl font-bold text-white">Survival Pack</h1>
            <div></div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredTopics.map((topic) => {
                const IconComponent = getTopicIcon(topic.id)
                return (
                  <button
                    key={topic.id}
                    onClick={() => loadVocabulary(topic)}
                    disabled={isLoadingVocabulary}
                    className="bg-white/20 hover:bg-white/30 transition-colors p-4 rounded-lg text-left group disabled:opacity-50"
                  >
                    <div className="flex items-start space-x-3">
                      <IconComponent className="h-6 w-6 text-white mt-1 group-hover:scale-110 transition-transform" />
                      <div>
                        <h3 className="font-medium text-white">{topic.name}</h3>
                        <p className="text-white/70 text-sm mt-1">{topic.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vocabulary practice page
  if (currentPage === "vocabulary") {
    const currentWord = vocabulary[currentWordIndex]

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setCurrentPage("topic")}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Topics
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">{selectedTopic?.name}</h1>
              <AudioStatusDisplay />
            </div>
            <Button
              onClick={() => setCurrentPage("confirmation")}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
            <div className="flex justify-between text-white text-sm mb-2">
              <span>Progress</span>
              <span>{currentWordIndex + 1} of {vocabulary.length}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentWordIndex + 1) / vocabulary.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Word Display */}
          {currentWord && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
              <div className="space-y-6">
                <div>
                  <p className="text-white/80 text-sm mb-2">Learning Language</p>
                  <h2 className="text-4xl font-bold text-white">{currentWord.sourceWord?.toLowerCase()}</h2>
                </div>
                
                <div className="h-px bg-white/20"></div>
                
                <div>
                  <p className="text-white/80 text-sm mb-2">Your Language</p>
                  <h3 className="text-2xl font-semibold text-white/90">{currentWord.targetWord?.toLowerCase()}</h3>
                </div>

                {currentWord.context && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <p className="text-white/70 text-sm">{currentWord.context}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-center justify-between">
              <Button
                onClick={goToPreviousWord}
                disabled={currentWordIndex === 0}
                variant="ghost"
                className="text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handlePlay}
                className="bg-white text-purple-600 hover:bg-white/90 px-8"
              >
                {unifiedAudio.isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>

              <Button
                onClick={goToNextWord}
                disabled={currentWordIndex === vocabulary.length - 1}
                variant="ghost"
                className="text-white hover:bg-white/20 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Auto-play toggle */}
            <div className="flex items-center justify-center mt-4 pt-4 border-t border-white/20">
              <Button
                onClick={() => unifiedAudio.updateSettings({ 
                  autoPlay: !unifiedAudio.settings.autoPlay 
                })}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                {unifiedAudio.settings.autoPlay ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Auto-play On
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Auto-play Off
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error display */}
          {unifiedAudio.error && (
            <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-4">
              <p className="text-red-200 text-sm">{unifiedAudio.error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Settings/confirmation page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setCurrentPage("vocabulary")}
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning
          </Button>
          <h1 className="text-xl font-bold text-white">Audio Settings</h1>
          <div></div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Pronunciation Speed</label>
              <select
                value={unifiedAudio.settings.pronunciationSpeed}
                onChange={(e) => unifiedAudio.updateSettings({ 
                  pronunciationSpeed: e.target.value as 'Slow' | 'Normal' | 'Fast'
                })}
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
              >
                <option value="Slow" className="text-gray-900">Slow</option>
                <option value="Normal" className="text-gray-900">Normal</option>
                <option value="Fast" className="text-gray-900">Fast</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Pause Between Languages (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={unifiedAudio.settings.pauseBetweenTranslations}
                onChange={(e) => unifiedAudio.updateSettings({ 
                  pauseBetweenTranslations: parseFloat(e.target.value)
                })}
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Pause Between Words (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={unifiedAudio.settings.pauseForNextWord}
                onChange={(e) => unifiedAudio.updateSettings({ 
                  pauseForNextWord: parseFloat(e.target.value)
                })}
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Repeat Learning Language
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={unifiedAudio.settings.repeatTargetLanguage}
                  onChange={(e) => unifiedAudio.updateSettings({ 
                    repeatTargetLanguage: parseInt(e.target.value)
                  })}
                  className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Repeat Native Language
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={unifiedAudio.settings.repeatMainLanguage}
                  onChange={(e) => unifiedAudio.updateSettings({ 
                    repeatMainLanguage: parseInt(e.target.value)
                  })}
                  className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Audio System Info */}
          <div className="mt-6 p-4 bg-white/10 rounded-lg">
            <h3 className="text-white font-medium mb-2">Audio System</h3>
            {unifiedAudio.hasAudioForTopic ? (
              <div className="space-y-2 text-sm text-blue-200">
                <p>✅ Umbriel's Teaching Voice Available</p>
                {unifiedAudio.manifestInfo && (
                  <>
                    <p>Quality: {unifiedAudio.manifestInfo.audio_config.quality}</p>
                    <p>Success Rate: {unifiedAudio.manifestInfo.statistics.success_rate}%</p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-yellow-200">
                🔄 Using browser TTS (Umbriel voice not available for this topic)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
