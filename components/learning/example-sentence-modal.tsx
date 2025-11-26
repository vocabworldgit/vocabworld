"use client"

import { X } from "lucide-react"
import { useEffect, useState } from "react"

interface ExampleSentenceModalProps {
  word: string
  translation: string
  targetLanguage: string
  nativeLanguage: string
  onClose: () => void
}

interface ExampleSentence {
  sentence: string
  translation: string
  loading?: boolean
}

export function ExampleSentenceModal({
  word,
  translation,
  targetLanguage,
  nativeLanguage,
  onClose
}: ExampleSentenceModalProps) {
  const [example, setExample] = useState<ExampleSentence>({
    sentence: "",
    translation: "",
    loading: true
  })

  useEffect(() => {
    const fetchExample = async () => {
      try {
        const response = await fetch('/api/vocabulary/example-sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word,
            translation,
            targetLanguage,
            nativeLanguage
          })
        })

        if (response.ok) {
          const data = await response.json()
          setExample({
            sentence: data.sentence,
            translation: data.translation,
            loading: false
          })
        } else {
          setExample({
            sentence: `Example: ${word}`,
            translation: `Example: ${translation}`,
            loading: false
          })
        }
      } catch (error) {
        console.error('Failed to fetch example sentence:', error)
        setExample({
          sentence: `Example: ${word}`,
          translation: `Example: ${translation}`,
          loading: false
        })
      }
    }

    fetchExample()
  }, [word, translation, targetLanguage, nativeLanguage])

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-semibold text-lg sm:text-xl">Example Sentence</h3>
            <p className="text-white/60 text-sm mt-1">{word}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        {example.loading ? (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-full"></div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Target Language Sentence */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-xl p-5">
              <div className="text-white/70 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                {targetLanguage}
              </div>
              <p className="text-white text-base sm:text-lg font-medium leading-relaxed">
                {example.sentence}
              </p>
            </div>

            {/* Native Language Translation */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/20 rounded-xl p-5">
              <div className="text-white/70 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                {nativeLanguage}
              </div>
              <p className="text-white text-base sm:text-lg leading-relaxed">
                {example.translation}
              </p>
            </div>
          </div>
        )}

        {/* Footer Tip */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-white/50 text-xs text-center">
            💡 Long-press any word to see example sentences
          </p>
        </div>
      </div>
    </div>
  )
}
