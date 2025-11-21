'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGeminiAudio } from '@/hooks/use-gemini-audio'

const testWords = [
  { word: 'comida', language: 'es', translation: 'food', id: 251 },
  { word: 'nourriture', language: 'fr', translation: 'food', id: 251 },
  { word: 'casa', language: 'es', translation: 'house', id: 563 },
  { word: 'peligro', language: 'es', translation: 'danger', id: 399 },
  { word: 'danger', language: 'fr', translation: 'danger', id: 399 },
  { word: 'cabeza', language: 'es', translation: 'head', id: 476 },
  { word: 'tête', language: 'fr', translation: 'head', id: 476 },
  { word: 'tiempo', language: 'es', translation: 'time', id: 721 },
]

export default function GeminiVoiceTest() {
  const { playGeminiAudio, isPlaying } = useGeminiAudio()
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)

  const handlePlay = async (word: string, language: string, id: number) => {
    setCurrentlyPlaying(`${word}_${language}`)
    try {
      const success = await playGeminiAudio(word, language, id)
      if (!success) {
        console.log(`No Gemini audio available for: ${word} (${language}) ID: ${id}`)
      }
    } catch (error) {
      console.error('Audio playback error:', error)
    } finally {
      setCurrentlyPlaying(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gemini TTS Voice Test</CardTitle>
          <CardDescription>
            Test the gender and quality of Gemini TTS voices. Click any word to hear the voice quality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testWords.map((item, index) => {
              const playingKey = `${item.word}_${item.language}`
              const isCurrentlyPlaying = currentlyPlaying === playingKey
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg">{item.word}</span>
                    <span className="text-sm text-gray-600">
                      {item.translation} ({item.language.toUpperCase()})
                    </span>
                  </div>
                  <Button
                    onClick={() => handlePlay(item.word, item.language, item.id)}
                    disabled={isPlaying}
                    variant={isCurrentlyPlaying ? "secondary" : "default"}
                    size="sm"
                  >
                    {isCurrentlyPlaying ? "Playing..." : "🔊 Play"}
                  </Button>
                </div>
              )
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Voice Analysis Notes:</h3>
            <ul className="text-sm space-y-1">
              <li>• Listen to multiple words to get a sense of the voice characteristics</li>
              <li>• The Gemini TTS voices are typically neutral to slightly feminine</li>
              <li>• Quality should be significantly higher than browser TTS</li>
              <li>• Each language may have slightly different voice characteristics</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
