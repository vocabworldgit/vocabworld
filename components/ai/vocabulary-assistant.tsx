"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { usePuterAI } from '@/hooks/use-puter-ai'
import { Loader2, Sparkles, BookOpen, MessageSquare, Languages } from 'lucide-react'

interface VocabularyAssistantProps {
  className?: string
}

export function VocabularyAssistant({ className }: VocabularyAssistantProps) {
  const [word, setWord] = useState('')
  const [language, setLanguage] = useState('Spanish')
  const [explanation, setExplanation] = useState('')
  const [examples, setExamples] = useState('')
  const [translation, setTranslation] = useState('')
  
  const { generateText, isLoading, error } = usePuterAI()

  const handleGetExplanation = async () => {
    if (!word.trim()) return
    
    try {
      const prompt = `Explain the word "${word}" in ${language}. Provide:
1. Definition
2. Part of speech
3. Pronunciation guide
4. Cultural context if relevant
Keep it concise but informative.`
      
      const result = await generateText(prompt, 'gpt-4o')
      setExplanation(result)
    } catch (err) {
      console.error('Error getting explanation:', err)
    }
  }

  const handleGetExamples = async () => {
    if (!word.trim()) return
    
    try {
      const prompt = `Create 3 example sentences using the word "${word}" in ${language}. 
Include:
1. A simple sentence
2. A conversational sentence
3. A more advanced sentence
Provide the ${language} sentence followed by English translation for each.`
      
      const result = await generateText(prompt, 'gpt-4o')
      setExamples(result)
    } catch (err) {
      console.error('Error getting examples:', err)
    }
  }

  const handleGetTranslation = async () => {
    if (!word.trim()) return
    
    try {
      const prompt = `Translate "${word}" from ${language} to English. Provide:
1. Direct translation
2. Alternative meanings if any
3. Common phrases or idioms using this word
4. Gender (if applicable for the language)`
      
      const result = await generateText(prompt, 'gpt-5-nano')
      setTranslation(result)
    } catch (err) {
      console.error('Error getting translation:', err)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!word.trim()) return
    
    try {
      const prompt = `Create a mini vocabulary quiz for the word "${word}" in ${language}:
1. Multiple choice question (4 options)
2. Fill in the blank sentence
3. True/False question about usage
Provide the correct answers at the end.`
      
      const result = await generateText(prompt, 'gpt-4.1')
      setExamples(result) // Using examples field for quiz
    } catch (err) {
      console.error('Error generating quiz:', err)
    }
  }

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          AI Vocabulary Assistant
        </CardTitle>
        <CardDescription>
          Get AI-powered explanations, examples, and translations for any word
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="word" className="text-sm font-medium">
              Word to learn
            </label>
            <Input
              id="word"
              placeholder="Enter a word..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium">
              Language
            </label>
            <Input
              id="language"
              placeholder="e.g., Spanish, French, German..."
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleGetExplanation}
            disabled={isLoading || !word.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            Explain Word
          </Button>
          
          <Button
            onClick={handleGetExamples}
            disabled={isLoading || !word.trim()}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Get Examples
          </Button>
          
          <Button
            onClick={handleGetTranslation}
            disabled={isLoading || !word.trim()}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
            Translate
          </Button>
          
          <Button
            onClick={handleGenerateQuiz}
            disabled={isLoading || !word.trim()}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Quiz
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Results Section */}
        <div className="space-y-4">
          {explanation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Explanation
                </Badge>
              </div>
              <Textarea
                value={explanation}
                readOnly
                className="min-h-[120px] bg-slate-50"
              />
            </div>
          )}
          
          {translation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <Languages className="h-3 w-3 mr-1" />
                  Translation
                </Badge>
              </div>
              <Textarea
                value={translation}
                readOnly
                className="min-h-[100px] bg-blue-50"
              />
            </div>
          )}
          
          {examples && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Examples & Usage
                </Badge>
              </div>
              <Textarea
                value={examples}
                readOnly
                className="min-h-[150px] bg-green-50"
              />
            </div>
          )}
        </div>

        <Separator />
        
        {/* Model Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>Powered by Puter.js - Free AI without API keys</p>
          <p>Using GPT-4o, GPT-4.1, and GPT-5-nano models</p>
        </div>
      </CardContent>
    </Card>
  )
}
