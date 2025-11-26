import { NextResponse } from 'next/server'

// Use Tatoeba's free API for real example sentences
export async function POST(request: Request) {
  try {
    const { word, translation, targetLanguage, nativeLanguage } = await request.json()

    console.log('🔍 Fetching example from Tatoeba:', { word, targetLanguage })

    // Map language names to ISO 639-3 codes used by Tatoeba
    const langCodes: { [key: string]: string } = {
      'German': 'deu',
      'French': 'fra', 
      'Spanish': 'spa',
      'Italian': 'ita',
      'Portuguese': 'por',
      'Dutch': 'nld',
      'Russian': 'rus',
      'Japanese': 'jpn',
      'Chinese': 'cmn',
      'Korean': 'kor',
      'Arabic': 'ara',
      'Turkish': 'tur',
      'Polish': 'pol',
      'Swedish': 'swe',
      'Norwegian': 'nor',
      'Danish': 'dan',
      'Finnish': 'fin',
      'Greek': 'ell',
      'Czech': 'ces',
      'Hungarian': 'hun',
      'Thai': 'tha',
      'Vietnamese': 'vie',
      'Hindi': 'hin',
      'English': 'eng'
    }

    const targetLangCode = langCodes[targetLanguage] || 'eng'
    const nativeLangCode = langCodes[nativeLanguage] || 'eng'

    // Search Tatoeba for sentences containing the word
    const searchUrl = `https://tatoeba.org/en/api_v0/search?from=${targetLangCode}&query=${encodeURIComponent(word)}&sort=relevance&limit=5`
    
    console.log('📡 Tatoeba URL:', searchUrl)

    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.warn('⚠️ Tatoeba API failed, using fallback')
      throw new Error('Tatoeba API failed')
    }

    const data = await response.json()
    
    console.log('📝 Tatoeba response:', JSON.stringify(data, null, 2))

    // Get sentences from Tatoeba
    if (data.results && data.results.length > 0) {
      // Get first sentence that contains the word
      const sentence = data.results[0].text
      
      if (sentence) {
        console.log('✅ Found sentence from Tatoeba:', sentence)
        console.log('🔄 Translating to native language:', nativeLanguage)
        
        // Always translate the sentence to user's native language using Google Translate
        try {
          const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${nativeLangCode}&dt=t&q=${encodeURIComponent(sentence)}`
          const translateRes = await fetch(translateUrl)
          
          if (translateRes.ok) {
            const translateData = await translateRes.json()
            const translatedText = translateData[0]?.map((item: any) => item[0]).join('').trim()
            
            if (translatedText && translatedText !== sentence) {
              console.log('✅ Translated to:', translatedText)
              return NextResponse.json({
                sentence: sentence,
                translation: translatedText
              })
            }
          }
        } catch (translateError) {
          console.warn('⚠️ Translation failed:', translateError)
        }
        
        // If translate fails, still return sentence with word hint
        return NextResponse.json({
          sentence: sentence,
          translation: translation
        })
      }
    }

    console.log('⚠️ No suitable sentence found, using template')
    return NextResponse.json(getTemplateFallback(word, translation, targetLanguage, nativeLanguage))

  } catch (error) {
    console.error('❌ Error fetching from Tatoeba:', error)
    const { word, translation, targetLanguage, nativeLanguage } = await request.json()
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
