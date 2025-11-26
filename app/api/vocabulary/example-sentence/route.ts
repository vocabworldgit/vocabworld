import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { word, translation, targetLanguage, nativeLanguage } = await request.json()

    console.log('🔍 Example sentence request:', { word, targetLanguage, nativeLanguage })

    // Use Google Gemini Free API to generate example sentences
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!GEMINI_API_KEY) {
      console.warn('⚠️ No Gemini API key found - using template fallback')
      return NextResponse.json(getTemplateFallback(word, translation, targetLanguage, nativeLanguage))
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
      const jsonMatch = cleanText.match(/\{[\s\S]*?"sentence"[\s\S]*?"translation"[\s\S]*?\}/)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        console.log('✅ Parsed successfully:', parsed)
        
        return NextResponse.json({
          sentence: parsed.sentence || getTemplateFallback(word, translation, targetLanguage, nativeLanguage).sentence,
          translation: parsed.translation || getTemplateFallback(word, translation, targetLanguage, nativeLanguage).translation
        })
      } else {
        console.warn('⚠️ No JSON match found in response')
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError)
      console.error('Raw text:', generatedText)
    }

    // Fallback to template
    console.log('⚠️ Using template fallback')
    return NextResponse.json(getTemplateFallback(word, translation, targetLanguage, nativeLanguage))

  } catch (error) {
    console.error('❌ Error generating example sentence:', error)
    const { word, translation, targetLanguage, nativeLanguage } = await request.json()
    
    // Return template fallback
    return NextResponse.json(getTemplateFallback(word, translation, targetLanguage, nativeLanguage))
  }
}

// Template fallback when API unavailable
function getTemplateFallback(word: string, translation: string, targetLang: string, nativeLang: string): { sentence: string, translation: string } {
  const patterns: { [key: string]: Array<{pattern: string, native: string}> } = {
    'German': [
      { pattern: `Ich brauche ${word}.`, native: `I need ${translation}.` },
      { pattern: `Wo ist ${word}?`, native: `Where is ${translation}?` },
      { pattern: `Das ist ${word}.`, native: `This is ${translation}.` },
    ],
    'French': [
      { pattern: `J'ai ${word}.`, native: `I have ${translation}.` },
      { pattern: `C'est ${word}.`, native: `This is ${translation}.` },
      { pattern: `Où est ${word}?`, native: `Where is ${translation}?` },
    ],
    'Spanish': [
      { pattern: `Necesito ${word}.`, native: `I need ${translation}.` },
      { pattern: `¿Dónde está ${word}?`, native: `Where is ${translation}?` },
      { pattern: `Esto es ${word}.`, native: `This is ${translation}.` },
    ],
  }

  const langPatterns = patterns[targetLang]
  if (langPatterns) {
    const random = Math.floor(Math.random() * langPatterns.length)
    return {
      sentence: langPatterns[random].pattern,
      translation: langPatterns[random].native
    }
  }

  return {
    sentence: word,
    translation: translation
  }
}
