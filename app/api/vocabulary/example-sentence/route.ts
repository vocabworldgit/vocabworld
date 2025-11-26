import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { word, translation, targetLanguage, nativeLanguage } = await request.json()

    console.log('🔍 Example sentence request:', { word, targetLanguage, nativeLanguage })

    // Use Google Gemini Free API to generate example sentences
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!GEMINI_API_KEY) {
      console.warn('⚠️ No Gemini API key found - using better fallback')
      // Better fallback without "This is"
      const fallbackExamples = getBetterFallback(word, translation, targetLanguage, nativeLanguage)
      return NextResponse.json(fallbackExamples)
    }

    const prompt = `Create a simple example sentence for language learning.

Word to use: "${word}"
Language: ${targetLanguage}
Translation: "${translation}" (${nativeLanguage})

Requirements:
1. Write ONE natural sentence in ${targetLanguage} using "${word}"
2. Make it conversational and realistic
3. Use simple grammar suitable for beginners
4. Keep it under 10 words
5. Translate the full sentence to ${nativeLanguage}

IMPORTANT: The sentence MUST be in ${targetLanguage}, NOT English.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{"sentence":"your sentence in ${targetLanguage}","translation":"translation in ${nativeLanguage}"}`

    console.log('🤖 Calling Gemini API...')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 150,
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API request failed: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    console.log('📝 Gemini response:', generatedText)

    // Try to parse JSON from the response
    try {
      // Remove markdown code blocks if present
      let cleanText = generatedText.trim()
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      
      // Find JSON object
      const jsonMatch = cleanText.match(/\{[^}]*"sentence"[^}]*"translation"[^}]*\}/s)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        console.log('✅ Parsed successfully:', parsed)
        
        return NextResponse.json({
          sentence: parsed.sentence || getBetterFallback(word, translation, targetLanguage, nativeLanguage).sentence,
          translation: parsed.translation || getBetterFallback(word, translation, targetLanguage, nativeLanguage).translation
        })
      } else {
        console.warn('⚠️ No JSON match found in response')
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError)
      console.error('Raw text:', generatedText)
    }

    // Fallback to better example
    console.log('⚠️ Using fallback')
    return NextResponse.json(getBetterFallback(word, translation, targetLanguage, nativeLanguage))

  } catch (error) {
    console.error('❌ Error generating example sentence:', error)
    const { word, translation, targetLanguage, nativeLanguage } = await request.json()
    
    // Return better fallback
    return NextResponse.json(getBetterFallback(word, translation, targetLanguage, nativeLanguage))
  }
}

// Better fallback function with language-specific examples
function getBetterFallback(word: string, translation: string, targetLanguage: string, nativeLanguage: string) {
  // Language-specific patterns for better fallbacks
  const patterns: { [key: string]: (w: string, t: string) => { sentence: string, translation: string } } = {
    'German': (w, t) => ({ sentence: `Ich brauche ${w}.`, translation: `I need ${t}.` }),
    'French': (w, t) => ({ sentence: `J'ai ${w}.`, translation: `I have ${t}.` }),
    'Spanish': (w, t) => ({ sentence: `Necesito ${w}.`, translation: `I need ${t}.` }),
    'Italian': (w, t) => ({ sentence: `Ho ${w}.`, translation: `I have ${t}.` }),
    'Portuguese': (w, t) => ({ sentence: `Eu tenho ${w}.`, translation: `I have ${t}.` }),
  }

  const pattern = patterns[targetLanguage]
  
  if (pattern) {
    return pattern(word, translation)
  }

  // Generic fallback for other languages
  return {
    sentence: `${word}...`,
    translation: `${translation}...`
  }
}
