"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { usePuterAI } from '@/hooks/use-puter-ai'
import { Loader2, ArrowRightLeft, Volume2, Globe } from 'lucide-react'

interface SmartTranslatorProps {
  className?: string
}

const languages = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
]

export function SmartTranslator({ className }: SmartTranslatorProps) {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [fromLanguage, setFromLanguage] = useState('en')
  const [toLanguage, setToLanguage] = useState('es')
  const [context, setContext] = useState('')
  
  const { generateText, isLoading, error } = usePuterAI()

  const handleTranslate = async () => {
    if (!sourceText.trim()) return
    
    try {
      const contextPrompt = context 
        ? `Context: ${context}\n\n` 
        : ''
      
      const prompt = `${contextPrompt}Translate the following text from ${fromLanguage === 'en' ? 'English' : languages.find(l => l.code === fromLanguage)?.name} to ${toLanguage === 'en' ? 'English' : languages.find(l => l.code === toLanguage)?.name}:

"${sourceText}"

Please provide:
1. The translation
2. Alternative translations if applicable
3. Cultural notes if relevant
4. Formality level (formal/informal) if different options exist

Text to translate: "${sourceText}"`
      
      const result = await generateText(prompt, 'gpt-4o')
      setTranslatedText(result)
    } catch (err) {
      console.error('Error translating:', err)
    }
  }

  const handleSwapLanguages = () => {
    setFromLanguage(toLanguage)
    setToLanguage(fromLanguage)
    setSourceText(translatedText)
    setTranslatedText('')
  }

  const handleDetectLanguage = async () => {
    if (!sourceText.trim()) return
    
    try {
      const prompt = `Detect the language of this text and provide:
1. Language name
2. Confidence level
3. Brief explanation of how you identified it

Text: "${sourceText}"`
      
      const result = await generateText(prompt, 'gpt-5-nano')
      // You could show this in a modal or temporary message
      alert(result)
    } catch (err) {
      console.error('Error detecting language:', err)
    }
  }

  const handleExplainTranslation = async () => {
    if (!sourceText.trim() || !translatedText.trim()) return
    
    try {
      const prompt = `Explain the translation process for:
Original: "${sourceText}"
Translation: "${translatedText}"

Please explain:
1. Why certain words were translated the way they were
2. Any grammatical changes made
3. Cultural adaptations
4. Alternative translation choices that could be made`
      
      const result = await generateText(prompt, 'gpt-4.1')
      setContext(result) // Show in context area
    } catch (err) {
      console.error('Error explaining translation:', err)
    }
  }

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-green-500" />
          Smart AI Translator
        </CardTitle>
        <CardDescription>
          Context-aware translation with cultural insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">From</label>
            <Select value={fromLanguage} onValueChange={setFromLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapLanguages}
            className="mt-6"
            disabled={isLoading}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">To</label>
            <Select value={toLanguage} onValueChange={setToLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Translation Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Source Text</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDetectLanguage}
                disabled={isLoading || !sourceText.trim()}
              >
                Detect Language
              </Button>
            </div>
            <Textarea
              placeholder="Enter text to translate..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Translation</label>
            <Textarea
              placeholder="Translation will appear here..."
              value={translatedText}
              readOnly
              className="min-h-[150px] bg-slate-50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleTranslate}
            disabled={isLoading || !sourceText.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            Translate
          </Button>
          
          <Button
            onClick={handleExplainTranslation}
            disabled={isLoading || !sourceText.trim() || !translatedText.trim()}
            variant="outline"
          >
            Explain Translation
          </Button>
        </div>

        {/* Context/Notes Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Context & Notes</label>
          <Textarea
            placeholder="Additional context for better translation (optional)..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            <p>Powered by Puter.js - Free AI Translation</p>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline">GPT-4o</Badge>
            <Badge variant="outline">Cultural Context</Badge>
            <Badge variant="outline">No API Key Required</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
