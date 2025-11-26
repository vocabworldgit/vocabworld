import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { word, translation, targetLanguage, nativeLanguage } = await request.json()

    // Use Google Gemini Free API to generate example sentences
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!GEMINI_API_KEY) {
      // Fallback to simple template-based examples if no API key
      return NextResponse.json({
        sentence: `This is ${word}.`,
        translation: `This is ${translation}.`
      })
    }

    const prompt = `You are a language learning assistant. Create a simple, practical example sentence for a beginner learner.

Word: "${word}" (in ${targetLanguage})
Translation: "${translation}" (in ${nativeLanguage})

Create ONE short, simple sentence using "${word}" that a beginner can understand. The sentence should:
- Be in ${targetLanguage} (the language being learned)
- Use everyday, common words
- Be practical and useful for real conversations
- Be clear and easy to understand for beginners
- Maximum 8-10 words

Then provide the translation of that sentence in ${nativeLanguage}.

Format your response as JSON:
{
  "sentence": "simple sentence in ${targetLanguage} using ${word}",
  "translation": "translation of that sentence in ${nativeLanguage}"
}

Keep it conversational and beginner-friendly.`

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
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Try to parse JSON from the response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       generatedText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const jsonText = jsonMatch[1] || jsonMatch[0]
        const parsed = JSON.parse(jsonText)
        
        return NextResponse.json({
          sentence: parsed.sentence || `Example: ${word}`,
          translation: parsed.translation || `Example: ${translation}`
        })
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
    }

    // Fallback to simple example
    return NextResponse.json({
      sentence: `Example with ${word}`,
      translation: `Example with ${translation}`
    })

  } catch (error) {
    console.error('Error generating example sentence:', error)
    
    // Return fallback example
    return NextResponse.json({
      sentence: `This is an example.`,
      translation: `This is an example.`
    })
  }
}
