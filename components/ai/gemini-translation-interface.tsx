'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Play, Pause, Square, Download, Settings, Zap, Globe } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Language groups for easier selection
const LANGUAGE_GROUPS = {
  'Major European': ['es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru'],
  'Nordic': ['da', 'sv', 'no', 'fi', 'is'],
  'Slavic': ['cs', 'sk', 'hr', 'sr', 'bg', 'sl', 'mk'],
  'Asian': ['ja', 'ko', 'zh', 'hi', 'th', 'vi', 'id', 'ms'],
  'Middle Eastern': ['ar', 'he', 'fa', 'tr', 'ur'],
  'African': ['sw', 'am', 'ha', 'yo', 'zu', 'xh'],
  'Test Languages': ['tr', 'es', 'fr', 'de', 'ja']
}

const LANGUAGE_NAMES: Record<string, string> = {
  'tr': 'Turkish', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'ja': 'Japanese',
  'it': 'Italian', 'pt': 'Portuguese', 'nl': 'Dutch', 'pl': 'Polish', 'ru': 'Russian',
  'da': 'Danish', 'sv': 'Swedish', 'no': 'Norwegian', 'fi': 'Finnish', 'is': 'Icelandic',
  'cs': 'Czech', 'sk': 'Slovak', 'hr': 'Croatian', 'sr': 'Serbian', 'bg': 'Bulgarian',
  'sl': 'Slovenian', 'mk': 'Macedonian', 'ko': 'Korean', 'zh': 'Chinese', 'hi': 'Hindi',
  'th': 'Thai', 'vi': 'Vietnamese', 'id': 'Indonesian', 'ms': 'Malay', 'ar': 'Arabic',
  'he': 'Hebrew', 'fa': 'Persian', 'ur': 'Urdu', 'sw': 'Swahili', 'am': 'Amharic',
  'ha': 'Hausa', 'yo': 'Yoruba', 'zu': 'Zulu', 'xh': 'Xhosa'
}

interface Translation {
  vocabularyId: number
  languageCode: string
  translatedWord: string
  context: string
  topic: string
  confidenceScore: number
}

interface TranslationStats {
  processed: number
  errors: number
  total: number
  currentWord: string
  currentLanguage: string
  startTime: Date | null
  estimatedTimeRemaining: number
}

export function GeminiTranslationInterface() {
  const [apiKey, setApiKey] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['tr'])
  const [batchSize, setBatchSize] = useState(10)
  const [wordLimit, setWordLimit] = useState(50)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [stats, setStats] = useState<TranslationStats>({
    processed: 0,
    errors: 0,
    total: 0,
    currentWord: '',
    currentLanguage: '',
    startTime: null,
    estimatedTimeRemaining: 0
  })
  const [translations, setTranslations] = useState<Translation[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [testMode, setTestMode] = useState(true)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    setLogs(prev => [...prev.slice(-50), logMessage])
  }

  const connectToGemini = async () => {
    if (!apiKey.trim()) {
      addLog('❌ API key is required')
      return
    }

    try {
      // Test connection by making a simple request
      const response = await fetch('/api/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      if (response.ok) {
        setIsConnected(true)
        addLog('✅ Connected to Gemini API successfully')
      } else {
        throw new Error('Connection failed')
      }
    } catch (error) {
      addLog('❌ Failed to connect to Gemini API')
      setIsConnected(false)
    }
  }

  const selectLanguageGroup = (groupName: string) => {
    const languages = LANGUAGE_GROUPS[groupName as keyof typeof LANGUAGE_GROUPS] || []
    setSelectedLanguages(languages)
    addLog(`Selected ${groupName}: ${languages.map(l => LANGUAGE_NAMES[l]).join(', ')}`)
  }

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langCode) 
        ? prev.filter(l => l !== langCode)
        : [...prev, langCode]
    )
  }

  const startTranslation = async () => {
    if (!isConnected) {
      addLog('❌ Please connect to Gemini API first')
      return
    }

    if (selectedLanguages.length === 0) {
      addLog('❌ Please select at least one language')
      return
    }

    setIsTranslating(true)
    setIsPaused(false)
    setStats({
      processed: 0,
      errors: 0,
      total: wordLimit * selectedLanguages.length,
      currentWord: '',
      currentLanguage: '',
      startTime: new Date(),
      estimatedTimeRemaining: 0
    })

    addLog(`🚀 Starting translation: ${wordLimit} words × ${selectedLanguages.length} languages`)
    addLog(`📋 Languages: ${selectedLanguages.map(l => LANGUAGE_NAMES[l]).join(', ')}`)

    try {
      const response = await fetch('/api/gemini/translate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          languages: selectedLanguages,
          batchSize,
          wordLimit,
          testMode
        })
      })

      if (!response.ok) {
        throw new Error('Translation request failed')
      }

      // Process streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const lines = text.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            
            if (data.type === 'progress') {
              setStats(prev => ({
                ...prev,
                processed: data.processed,
                errors: data.errors,
                currentWord: data.currentWord || '',
                currentLanguage: data.currentLanguage || '',
                estimatedTimeRemaining: data.estimatedTimeRemaining || 0
              }))
            } else if (data.type === 'translation') {
              setTranslations(prev => [...prev, data.translation])
            } else if (data.type === 'log') {
              addLog(data.message)
            } else if (data.type === 'complete') {
              addLog(`🎉 Translation complete! ${data.processed} successful, ${data.errors} errors`)
              setIsTranslating(false)
            }
          } catch (e) {
            // Ignore parsing errors for partial lines
          }
        }
      }
    } catch (error) {
      addLog(`❌ Translation failed: ${error}`)
      setIsTranslating(false)
    }
  }

  const pauseTranslation = () => {
    setIsPaused(true)
    addLog('⏸️ Translation paused')
  }

  const resumeTranslation = () => {
    setIsPaused(false)
    addLog('▶️ Translation resumed')
  }

  const stopTranslation = () => {
    setIsTranslating(false)
    setIsPaused(false)
    addLog('⏹️ Translation stopped')
  }

  const exportTranslations = () => {
    const data = {
      timestamp: new Date().toISOString(),
      stats: stats,
      translations: translations
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gemini-translations-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    addLog(`📄 Exported ${translations.length} translations`)
  }

  const runSpeedTest = async () => {
    setSelectedLanguages(['tr', 'es', 'fr', 'de', 'ja'])
    setWordLimit(20)
    setBatchSize(5)
    setTestMode(true)
    addLog('⚡ Speed test configured: 20 words × 5 languages')
  }

  const calculateProgress = () => {
    return stats.total > 0 ? (stats.processed / stats.total) * 100 : 0
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-500" />
            Gemini Translation Engine
          </CardTitle>
          <CardDescription>
            Context-aware vocabulary translation powered by Google Gemini AI
          </CardDescription>
        </CardHeader>
      </Card>

      {/* API Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="apiKey">Gemini API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                disabled={isConnected}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={connectToGemini}
                disabled={isConnected || !apiKey.trim()}
              >
                {isConnected ? '✅ Connected' : 'Connect'}
              </Button>
            </div>
          </div>
          
          {!isConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Language Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(LANGUAGE_GROUPS).map(([groupName, languages]) => (
              <Button
                key={groupName}
                variant="outline"
                size="sm"
                onClick={() => selectLanguageGroup(groupName)}
                className="justify-start"
              >
                {groupName} ({languages.length})
              </Button>
            ))}
          </div>
          
          <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                <div key={code} className="flex items-center space-x-2">
                  <Checkbox
                    id={code}
                    checked={selectedLanguages.includes(code)}
                    onCheckedChange={() => toggleLanguage(code)}
                  />
                  <label htmlFor={code} className="text-sm cursor-pointer">
                    {name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {selectedLanguages.map(code => (
              <Badge key={code} variant="secondary">
                {LANGUAGE_NAMES[code]} ({code})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Translation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Translation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="wordLimit">Words to Translate</Label>
              <Input
                id="wordLimit"
                type="number"
                value={wordLimit}
                onChange={(e) => setWordLimit(Number(e.target.value))}
                min="1"
                max="2681"
              />
            </div>
            <div>
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                min="1"
                max="50"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="testMode"
                checked={testMode}
                onCheckedChange={(checked: boolean) => setTestMode(checked === true)}
              />
              <Label htmlFor="testMode">Test Mode (Skip existing)</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={runSpeedTest} variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Speed Test Setup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Translation Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Translation Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={startTranslation}
              disabled={!isConnected || isTranslating || selectedLanguages.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Translation
            </Button>
            <Button
              onClick={pauseTranslation}
              disabled={!isTranslating || isPaused}
              variant="outline"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button
              onClick={resumeTranslation}
              disabled={!isTranslating || !isPaused}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
            <Button
              onClick={stopTranslation}
              disabled={!isTranslating}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>

          {isTranslating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {stats.processed} / {stats.total}</span>
                <span>Errors: {stats.errors}</span>
              </div>
              <Progress value={calculateProgress()} className="w-full" />
              <div className="text-sm text-gray-600">
                Current: "{stats.currentWord}" → {stats.currentLanguage}
                {stats.estimatedTimeRemaining > 0 && (
                  <span className="ml-4">
                    ETA: {formatTime(stats.estimatedTimeRemaining)}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Translation Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Translation Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={logs.slice(-20).join('\n')}
              readOnly
              className="h-60 text-xs font-mono"
            />
          </CardContent>
        </Card>

        {/* Sample Translations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Translations</CardTitle>
            <Button
              onClick={exportTranslations}
              disabled={translations.length === 0}
              size="sm"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {translations.slice(-15).map((translation, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="font-medium">
                    "{translation.translatedWord}" ({translation.languageCode.toUpperCase()})
                  </div>
                  <div className="text-gray-600 text-xs">
                    {translation.context} • Score: {translation.confidenceScore}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
