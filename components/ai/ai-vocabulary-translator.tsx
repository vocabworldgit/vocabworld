"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePuterAI } from '@/hooks/use-puter-ai'
import { Loader2, Globe, Download, Play, Pause, RotateCcw } from 'lucide-react'

// Language configurations
const LANGUAGE_GROUPS = {
  test: ['es', 'fr', 'tr', 'de', 'ja'],
  european: ['es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi'],
  asian: ['ja', 'ko', 'zh', 'hi', 'th', 'vi', 'id', 'my', 'bn', 'gu'],
  african: ['ar', 'sw', 'am', 'ha', 'yo', 'ig', 'zu', 'xh', 'af', 'so'],
  all93: [] // Will be populated from database
}

const LANGUAGE_NAMES: Record<string, string> = {
  'es': 'Spanish', 'fr': 'French', 'tr': 'Turkish', 'de': 'German', 'ja': 'Japanese',
  'it': 'Italian', 'pt': 'Portuguese', 'nl': 'Dutch', 'sv': 'Swedish', 'no': 'Norwegian',
  'da': 'Danish', 'fi': 'Finnish', 'ko': 'Korean', 'zh': 'Chinese', 'hi': 'Hindi',
  'th': 'Thai', 'vi': 'Vietnamese', 'id': 'Indonesian', 'my': 'Burmese', 'bn': 'Bengali',
  'gu': 'Gujarati', 'ar': 'Arabic', 'sw': 'Swahili', 'am': 'Amharic', 'ha': 'Hausa',
  'yo': 'Yoruba', 'ig': 'Igbo', 'zu': 'Zulu', 'xh': 'Xhosa', 'af': 'Afrikaans', 'so': 'Somali'
}

interface VocabularyWord {
  id: number
  word_en: string
  context: string
  topic_name: string
  topic_description: string
  part_of_speech?: string
  difficulty_level?: string
}

interface Translation {
  vocabularyId: number
  languageCode: string
  translatedWord: string
  context: string
  confidenceScore: number
}

interface AITranslatorProps {
  className?: string
}

export function AIVocabularyTranslator({ className }: AITranslatorProps) {
  const [vocabularyWords, setVocabularyWords] = useState<VocabularyWord[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['es', 'fr', 'tr'])
  const [batchSize, setBatchSize] = useState(10)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [translations, setTranslations] = useState<Translation[]>([])
  const [currentWord, setCurrentWord] = useState<string>('')
  const [currentLanguage, setCurrentLanguage] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('test')
  
  const { generateText, isLoading, error } = usePuterAI()

  // Load vocabulary words from database (mock for now)
  useEffect(() => {
    loadVocabularyData()
  }, [])

  const loadVocabularyData = async () => {
    // In a real implementation, this would fetch from your database
    // For now, we'll simulate the data structure
    const mockVocabulary: VocabularyWord[] = [
      {
        id: 1,
        word_en: 'hello',
        context: 'basic greetings - greetings',
        topic_name: 'Greetings',
        topic_description: 'Essential greetings and social interactions'
      },
      {
        id: 2,
        word_en: 'even',
        context: 'counting & quantities - numbers',
        topic_name: 'Numbers',
        topic_description: 'Numbers, quantities, and mathematical terms'
      },
      {
        id: 3,
        word_en: 'left',
        context: 'basic direction words - directions',
        topic_name: 'Directions & Transportation',
        topic_description: 'Navigation and directional vocabulary'
      }
    ]
    
    setVocabularyWords(mockVocabulary)
    setTotalWords(mockVocabulary.length)
    addLog(`Loaded ${mockVocabulary.length} vocabulary words`)
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const translateWord = async (
    word: VocabularyWord, 
    targetLanguage: string
  ): Promise<string> => {
    const prompt = `Translate the English word "${word.word_en}" to ${LANGUAGE_NAMES[targetLanguage]} (${targetLanguage}).

Context Information:
- Topic: ${word.topic_name} (${word.topic_description})
- Specific Context: ${word.context}
- Part of Speech: ${word.part_of_speech || 'not specified'}

IMPORTANT CONTEXT AWARENESS:
- Choose the translation that fits the specific topic and context
- For example: "even" in Numbers context = mathematical term (like "çift" in Turkish)
- For example: "even" in general context = adverb meaning "also" (like "hatta" in Turkish)
- Consider the educational context and choose the most appropriate meaning

Requirements:
1. Return ONLY the translated word or phrase
2. Choose the most contextually appropriate translation
3. Use the meaning that fits the topic "${word.topic_name}"
4. No explanations, just the translation

Word: "${word.word_en}"
Target Language: ${LANGUAGE_NAMES[targetLanguage]}
Context: ${word.context}`;

    try {
      const translation = await generateText(prompt, 'gpt-4o')
      return translation.trim()
    } catch (error) {
      throw new Error(`Translation failed: ${error}`)
    }
  }

  const startTranslation = async () => {
    if (vocabularyWords.length === 0 || selectedLanguages.length === 0) {
      addLog('Error: No vocabulary words or languages selected')
      return
    }

    setIsTranslating(true)
    setIsPaused(false)
    setCurrentProgress(0)
    setTranslations([])
    
    const wordsToTranslate = vocabularyWords.slice(0, batchSize)
    const totalTranslations = wordsToTranslate.length * selectedLanguages.length
    let completedTranslations = 0

    addLog(`Starting translation of ${wordsToTranslate.length} words into ${selectedLanguages.length} languages`)
    addLog(`Total translations to complete: ${totalTranslations}`)

    try {
      for (const word of wordsToTranslate) {
        if (isPaused) {
          addLog('Translation paused')
          break
        }

        setCurrentWord(word.word_en)
        addLog(`Translating: "${word.word_en}" (${word.topic_name})`)

        for (const languageCode of selectedLanguages) {
          if (isPaused) break

          setCurrentLanguage(LANGUAGE_NAMES[languageCode] || languageCode)
          
          try {
            const translatedWord = await translateWord(word, languageCode)
            
            const translation: Translation = {
              vocabularyId: word.id,
              languageCode,
              translatedWord,
              context: `${word.topic_name} - ${word.context}`,
              confidenceScore: 0.95
            }

            setTranslations(prev => [...prev, translation])
            completedTranslations++
            setCurrentProgress((completedTranslations / totalTranslations) * 100)

            addLog(`  ${LANGUAGE_NAMES[languageCode]}: "${translatedWord}"`)

            // Small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))

          } catch (error) {
            addLog(`  Error translating to ${LANGUAGE_NAMES[languageCode]}: ${error}`)
            completedTranslations++
            setCurrentProgress((completedTranslations / totalTranslations) * 100)
          }
        }
      }

      if (!isPaused) {
        addLog(`Translation completed! Generated ${translations.length + completedTranslations} translations`)
        setIsTranslating(false)
        setCurrentWord('')
        setCurrentLanguage('')
      }

    } catch (error) {
      addLog(`Translation process error: ${error}`)
      setIsTranslating(false)
    }
  }

  const pauseTranslation = () => {
    setIsPaused(true)
    addLog('Translation paused by user')
  }

  const resumeTranslation = () => {
    setIsPaused(false)
    addLog('Translation resumed')
    startTranslation()
  }

  const resetTranslation = () => {
    setIsTranslating(false)
    setIsPaused(false)
    setCurrentProgress(0)
    setTranslations([])
    setCurrentWord('')
    setCurrentLanguage('')
    setLogs([])
    addLog('Translation reset')
  }

  const exportTranslations = () => {
    const data = JSON.stringify(translations, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vocabulary_translations.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addLog(`Exported ${translations.length} translations`)
  }

  const handleGroupSelection = (group: string) => {
    setSelectedGroup(group)
    setSelectedLanguages(LANGUAGE_GROUPS[group as keyof typeof LANGUAGE_GROUPS] || [])
  }

  return (
    <Card className={`w-full max-w-6xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-blue-500" />
          AI Vocabulary Translator - Context-Aware Translation
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language Group</label>
            <Select value={selectedGroup} onValueChange={handleGroupSelection}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test (5 languages)</SelectItem>
                <SelectItem value="european">European (10 languages)</SelectItem>
                <SelectItem value="asian">Asian (10 languages)</SelectItem>
                <SelectItem value="african">African (10 languages)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Batch Size</label>
            <Input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              min={1}
              max={100}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Total Words</label>
            <Input value={totalWords} readOnly />
          </div>
        </div>

        {/* Selected Languages */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selected Languages</label>
          <div className="flex flex-wrap gap-2">
            {selectedLanguages.map(lang => (
              <Badge key={lang} variant="secondary">
                {LANGUAGE_NAMES[lang] || lang} ({lang})
              </Badge>
            ))}
          </div>
        </div>

        {/* Progress Section */}
        {isTranslating && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Translation Progress</span>
                <span>{Math.round(currentProgress)}%</span>
              </div>
              <Progress value={currentProgress} className="w-full" />
            </div>
            
            {currentWord && (
              <div className="text-sm text-gray-600">
                <p>Current Word: <strong>"{currentWord}"</strong></p>
                <p>Current Language: <strong>{currentLanguage}</strong></p>
              </div>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={startTranslation}
            disabled={isTranslating || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start Translation
          </Button>
          
          {isTranslating && !isPaused && (
            <Button
              onClick={pauseTranslation}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          
          {isPaused && (
            <Button
              onClick={resumeTranslation}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
          
          <Button
            onClick={resetTranslation}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          {translations.length > 0 && (
            <Button
              onClick={exportTranslations}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Translations
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Statistics */}
        {translations.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{translations.length}</div>
              <div className="text-sm text-gray-600">Translations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{selectedLanguages.length}</div>
              <div className="text-sm text-gray-600">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{batchSize}</div>
              <div className="text-sm text-gray-600">Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(currentProgress)}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
        )}

        {/* Translation Logs */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Translation Log</label>
          <Textarea
            value={logs.slice(-20).join('\n')}
            readOnly
            className="h-40 text-xs font-mono bg-gray-50"
          />
        </div>

        {/* Sample Translations */}
        {translations.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Sample Translations</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {translations.slice(-10).map((translation, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  <strong>"{translation.translatedWord}"</strong> ({translation.languageCode}) 
                  <span className="text-gray-600"> - {translation.context}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
