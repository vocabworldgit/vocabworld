import { NextResponse } from 'next/server'

// NO AI API - Simple template-based examples that work for unlimited users at zero cost
export async function POST(request: Request) {
  try {
    const { word, translation, targetLanguage, nativeLanguage } = await request.json()

    const example = generateExampleSentence(word, translation, targetLanguage, nativeLanguage)
    
    return NextResponse.json(example)

  } catch (error) {
    console.error('Error generating example sentence:', error)
    return NextResponse.json({
      sentence: word,
      translation: translation
    })
  }
}

// Smart template-based example generation - works offline, unlimited usage, zero cost
function generateExampleSentence(word: string, translation: string, targetLang: string, nativeLang: string) {
  // Multiple sentence patterns per language for variety
  const languagePatterns: { [key: string]: Array<{pattern: string, native: string}> } = {
    'German': [
      { pattern: `Ich brauche ${word}.`, native: `I need ${translation}.` },
      { pattern: `Wo ist ${word}?`, native: `Where is ${translation}?` },
      { pattern: `Das ist ${word}.`, native: `This is ${translation}.` },
      { pattern: `Ich habe ${word}.`, native: `I have ${translation}.` },
      { pattern: `Ich sehe ${word}.`, native: `I see ${translation}.` },
    ],
    'French': [
      { pattern: `J'ai ${word}.`, native: `I have ${translation}.` },
      { pattern: `C'est ${word}.`, native: `This is ${translation}.` },
      { pattern: `Où est ${word}?`, native: `Where is ${translation}?` },
      { pattern: `Je vois ${word}.`, native: `I see ${translation}.` },
      { pattern: `Voici ${word}.`, native: `Here is ${translation}.` },
    ],
    'Spanish': [
      { pattern: `Necesito ${word}.`, native: `I need ${translation}.` },
      { pattern: `¿Dónde está ${word}?`, native: `Where is ${translation}?` },
      { pattern: `Esto es ${word}.`, native: `This is ${translation}.` },
      { pattern: `Tengo ${word}.`, native: `I have ${translation}.` },
      { pattern: `Veo ${word}.`, native: `I see ${translation}.` },
    ],
    'Italian': [
      { pattern: `Ho ${word}.`, native: `I have ${translation}.` },
      { pattern: `Questo è ${word}.`, native: `This is ${translation}.` },
      { pattern: `Dov'è ${word}?`, native: `Where is ${translation}?` },
      { pattern: `Vedo ${word}.`, native: `I see ${translation}.` },
      { pattern: `Ecco ${word}.`, native: `Here is ${translation}.` },
    ],
    'Portuguese': [
      { pattern: `Eu tenho ${word}.`, native: `I have ${translation}.` },
      { pattern: `Isto é ${word}.`, native: `This is ${translation}.` },
      { pattern: `Onde está ${word}?`, native: `Where is ${translation}?` },
      { pattern: `Eu vejo ${word}.`, native: `I see ${translation}.` },
      { pattern: `Preciso de ${word}.`, native: `I need ${translation}.` },
    ],
    'Dutch': [
      { pattern: `Ik heb ${word}.`, native: `I have ${translation}.` },
      { pattern: `Dit is ${word}.`, native: `This is ${translation}.` },
      { pattern: `Waar is ${word}?`, native: `Where is ${translation}?` },
      { pattern: `Ik zie ${word}.`, native: `I see ${translation}.` },
    ],
    'Russian': [
      { pattern: `У меня есть ${word}.`, native: `I have ${translation}.` },
      { pattern: `Это ${word}.`, native: `This is ${translation}.` },
      { pattern: `Где ${word}?`, native: `Where is ${translation}?` },
      { pattern: `Я вижу ${word}.`, native: `I see ${translation}.` },
    ],
    'Japanese': [
      { pattern: `${word}があります。`, native: `There is ${translation}.` },
      { pattern: `これは${word}です。`, native: `This is ${translation}.` },
      { pattern: `${word}はどこですか？`, native: `Where is ${translation}?` },
      { pattern: `${word}を見ます。`, native: `I see ${translation}.` },
    ],
    'Chinese': [
      { pattern: `我有${word}。`, native: `I have ${translation}.` },
      { pattern: `这是${word}。`, native: `This is ${translation}.` },
      { pattern: `${word}在哪里？`, native: `Where is ${translation}?` },
      { pattern: `我看到${word}。`, native: `I see ${translation}.` },
    ],
    'Korean': [
      { pattern: `${word}가 있어요.`, native: `There is ${translation}.` },
      { pattern: `이것은 ${word}예요.`, native: `This is ${translation}.` },
      { pattern: `${word}가 어디 있어요?`, native: `Where is ${translation}?` },
    ],
    'Arabic': [
      { pattern: `عندي ${word}.`, native: `I have ${translation}.` },
      { pattern: `هذا ${word}.`, native: `This is ${translation}.` },
      { pattern: `أين ${word}؟`, native: `Where is ${translation}?` },
    ],
    'Turkish': [
      { pattern: `${word} var.`, native: `There is ${translation}.` },
      { pattern: `Bu ${word}.`, native: `This is ${translation}.` },
      { pattern: `${word} nerede?`, native: `Where is ${translation}?` },
    ],
    'Polish': [
      { pattern: `Mam ${word}.`, native: `I have ${translation}.` },
      { pattern: `To jest ${word}.`, native: `This is ${translation}.` },
      { pattern: `Gdzie jest ${word}?`, native: `Where is ${translation}?` },
    ],
    'Swedish': [
      { pattern: `Jag har ${word}.`, native: `I have ${translation}.` },
      { pattern: `Det här är ${word}.`, native: `This is ${translation}.` },
      { pattern: `Var är ${word}?`, native: `Where is ${translation}?` },
    ],
    'Norwegian': [
      { pattern: `Jeg har ${word}.`, native: `I have ${translation}.` },
      { pattern: `Dette er ${word}.`, native: `This is ${translation}.` },
      { pattern: `Hvor er ${word}?`, native: `Where is ${translation}?` },
    ],
    'Danish': [
      { pattern: `Jeg har ${word}.`, native: `I have ${translation}.` },
      { pattern: `Dette er ${word}.`, native: `This is ${translation}.` },
      { pattern: `Hvor er ${word}?`, native: `Where is ${translation}?` },
    ],
    'Finnish': [
      { pattern: `Minulla on ${word}.`, native: `I have ${translation}.` },
      { pattern: `Tämä on ${word}.`, native: `This is ${translation}.` },
      { pattern: `Missä on ${word}?`, native: `Where is ${translation}?` },
    ],
    'Greek': [
      { pattern: `Έχω ${word}.`, native: `I have ${translation}.` },
      { pattern: `Αυτό είναι ${word}.`, native: `This is ${translation}.` },
      { pattern: `Πού είναι ${word};`, native: `Where is ${translation}?` },
    ],
    'Czech': [
      { pattern: `Mám ${word}.`, native: `I have ${translation}.` },
      { pattern: `To je ${word}.`, native: `This is ${translation}.` },
      { pattern: `Kde je ${word}?`, native: `Where is ${translation}?` },
    ],
    'Hungarian': [
      { pattern: `Van ${word}.`, native: `There is ${translation}.` },
      { pattern: `Ez ${word}.`, native: `This is ${translation}.` },
      { pattern: `Hol van ${word}?`, native: `Where is ${translation}?` },
    ],
    'Thai': [
      { pattern: `ฉันมี${word}`, native: `I have ${translation}.` },
      { pattern: `นี่คือ${word}`, native: `This is ${translation}.` },
      { pattern: `${word}อยู่ที่ไหน`, native: `Where is ${translation}?` },
    ],
    'Vietnamese': [
      { pattern: `Tôi có ${word}.`, native: `I have ${translation}.` },
      { pattern: `Đây là ${word}.`, native: `This is ${translation}.` },
      { pattern: `${word} ở đâu?`, native: `Where is ${translation}?` },
    ],
    'Hindi': [
      { pattern: `मेरे पास ${word} है।`, native: `I have ${translation}.` },
      { pattern: `यह ${word} है।`, native: `This is ${translation}.` },
      { pattern: `${word} कहाँ है?`, native: `Where is ${translation}?` },
    ],
  }

  const patterns = languagePatterns[targetLang]

  if (patterns && patterns.length > 0) {
    // Pick a random pattern for variety
    const randomIndex = Math.floor(Math.random() * patterns.length)
    return {
      sentence: patterns[randomIndex].pattern,
      translation: patterns[randomIndex].native
    }
  }

  // Generic fallback for unsupported languages
  return {
    sentence: word,
    translation: translation
  }
}
