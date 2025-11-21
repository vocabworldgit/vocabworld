import { useCallback, useState } from 'react'

// Extend the global window object to include puter
declare global {
  interface Window {
    puter: {
      ai: {
        chat: (message: string, options?: { model?: string; stream?: boolean }) => Promise<string | AsyncGenerator<{ text: string }, void, unknown>>
        txt2img: (prompt: string) => Promise<HTMLImageElement>
      }
    }
  }
}

interface UsePuterAIReturn {
  generateText: (prompt: string, model?: string) => Promise<string>
  generateImage: (prompt: string) => Promise<HTMLImageElement>
  streamText: (prompt: string, model?: string) => Promise<AsyncGenerator<{ text: string }, void, unknown>>
  isLoading: boolean
  error: string | null
}

export function usePuterAI(): UsePuterAIReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateText = useCallback(async (prompt: string, model: string = 'gpt-5-nano'): Promise<string> => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (!window.puter) {
        throw new Error('Puter.js not loaded. Please ensure the script is included in your HTML.')
      }
      
      const response = await window.puter.ai.chat(prompt, { model })
      return response as string
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateImage = useCallback(async (prompt: string): Promise<HTMLImageElement> => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (!window.puter) {
        throw new Error('Puter.js not loaded. Please ensure the script is included in your HTML.')
      }
      
      const imageElement = await window.puter.ai.txt2img(prompt)
      return imageElement
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const streamText = useCallback(async (prompt: string, model: string = 'gpt-5-nano'): Promise<AsyncGenerator<{ text: string }, void, unknown>> => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (!window.puter) {
        throw new Error('Puter.js not loaded. Please ensure the script is included in your HTML.')
      }
      
      const response = await window.puter.ai.chat(prompt, { model, stream: true })
      return response as AsyncGenerator<{ text: string }, void, unknown>
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    generateText,
    generateImage,
    streamText,
    isLoading,
    error
  }
}
