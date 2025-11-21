'use client';

import React, { useState, useEffect } from 'react';
import { azureTTSService, AzureVoice } from '@/lib/azure-tts-service';

interface TestResult {
  language: string;
  word: string;
  success: boolean;
  error?: string;
  audioUrl?: string;
}

export function AzureTTSTest() {
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [unsupportedLanguages, setUnsupportedLanguages] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [testWords] = useState(['hello', 'thank you', 'goodbye']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [totalTests, setTotalTests] = useState(0);

  const languageNames: { [key: string]: string } = {
    'af': 'Afrikaans', 'am': 'Amharic', 'az': 'Azerbaijani', 'be': 'Belarusian',
    'bg': 'Bulgarian', 'bs': 'Bosnian', 'ca': 'Catalan', 'cs': 'Czech',
    'cy': 'Welsh', 'da': 'Danish', 'el': 'Greek', 'et': 'Estonian',
    'eu': 'Basque', 'fa': 'Persian', 'fi': 'Finnish', 'ga': 'Irish',
    'gu': 'Gujarati', 'he': 'Hebrew', 'hr': 'Croatian', 'hu': 'Hungarian',
    'is': 'Icelandic', 'ka': 'Georgian', 'kk': 'Kazakh', 'km': 'Khmer',
    'kn': 'Kannada', 'ky': 'Kyrgyz', 'lo': 'Lao', 'lt': 'Lithuanian',
    'lv': 'Latvian', 'mk': 'Macedonian', 'ml': 'Malayalam', 'mn': 'Mongolian',
    'ms': 'Malay', 'mt': 'Maltese', 'my': 'Myanmar', 'ne': 'Nepali',
    'no': 'Norwegian', 'ps': 'Pashto', 'si': 'Sinhala', 'sk': 'Slovak',
    'sl': 'Slovenian', 'sq': 'Albanian', 'sr': 'Serbian', 'sv': 'Swedish',
    'sw': 'Swahili', 'tg': 'Tajik', 'tk': 'Turkmen', 'ur': 'Urdu',
    'uz': 'Uzbek', 'zh': 'Chinese'
  };

  useEffect(() => {
    checkServiceAvailability();
  }, []);

  const checkServiceAvailability = () => {
    const status = azureTTSService.getStatus();
    setIsServiceAvailable(status.available);

    if (status.available) {
      const { supported, unsupported } = azureTTSService.getAvailableLanguagesForTTS();
      setSupportedLanguages(supported);
      setUnsupportedLanguages(unsupported);
      setSelectedLanguages(supported.slice(0, 5)); // Select first 5 by default
    }
  };

  const generateTestBatch = async () => {
    if (selectedLanguages.length === 0) return;

    setIsGenerating(true);
    setTestResults([]);
    setCurrentProgress(0);
    
    const total = selectedLanguages.length * testWords.length;
    setTotalTests(total);

    const results: TestResult[] = [];
    let progressCount = 0;

    for (const langCode of selectedLanguages) {
      for (const word of testWords) {
        try {
          console.log(`🔊 Generating "${word}" in ${langCode}...`);
          
          const audioBuffer = await azureTTSService.generateTTSAudio(word, langCode, {
            gender: 'Female',
            speed: 1.0,
            pitch: 'medium'
          });

          if (audioBuffer) {
            // Convert ArrayBuffer to Blob and create URL for playback
            const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(blob);

            results.push({
              language: langCode,
              word,
              success: true,
              audioUrl
            });
            
            console.log(`✅ Generated "${word}" in ${langCode}`);
          } else {
            results.push({
              language: langCode,
              word,
              success: false,
              error: 'No audio data received'
            });
            console.log(`❌ Failed to generate "${word}" in ${langCode}`);
          }
        } catch (error) {
          results.push({
            language: langCode,
            word,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.error(`❌ Error generating "${word}" in ${langCode}:`, error);
        }

        progressCount++;
        setCurrentProgress(progressCount);
        setTestResults([...results]);
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setIsGenerating(false);
    console.log('🎉 Test batch generation completed');
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  const getSuccessRate = () => {
    if (testResults.length === 0) return 0;
    const successful = testResults.filter(r => r.success).length;
    return Math.round((successful / testResults.length) * 100);
  };

  const getLanguageResults = (langCode: string) => {
    return testResults.filter(r => r.language === langCode);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Azure TTS Language Detection & Test</h1>
        <p className="text-gray-600">
          Test Azure Speech synthesis for languages missing from your alnilam library
        </p>
      </div>

      {/* Service Status */}
      <div className={`p-4 rounded-lg ${isServiceAvailable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isServiceAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">
            Azure TTS Service: {isServiceAvailable ? 'Available' : 'Not Available'}
          </span>
        </div>
        {!isServiceAvailable && (
          <p className="text-sm text-red-600 mt-2">
            Please check your NEXT_PUBLIC_AZURE_SPEECH_KEY and NEXT_PUBLIC_AZURE_REGION environment variables.
          </p>
        )}
      </div>

      {isServiceAvailable && (
        <>
          {/* Language Analysis */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3">
                ✅ Azure-Supported Languages ({supportedLanguages.length})
              </h3>
              <p className="text-sm text-green-700 mb-3">
                These languages can be added to your TTS library using Azure:
              </p>
              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                {supportedLanguages.map(code => (
                  <div key={code} className="text-xs py-1">
                    <span className="font-mono bg-green-100 px-1 rounded">{code.toUpperCase()}</span>
                    <span className="ml-1">{languageNames[code] || code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-3">
                ❌ Unsupported Languages ({unsupportedLanguages.length})
              </h3>
              <p className="text-sm text-red-700 mb-3">
                These languages are not supported by Azure Speech:
              </p>
              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                {unsupportedLanguages.map(code => (
                  <div key={code} className="text-xs py-1">
                    <span className="font-mono bg-red-100 px-1 rounded">{code.toUpperCase()}</span>
                    <span className="ml-1">{languageNames[code] || code}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Configuration */}
          {supportedLanguages.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-4">🧪 Test Batch Configuration</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Select Languages to Test (Max 10):
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-blue-200 rounded p-2 bg-white">
                  {supportedLanguages.slice(0, 15).map(code => (
                    <label key={code} className="flex items-center space-x-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(code)}
                        onChange={(e) => {
                          if (e.target.checked && selectedLanguages.length < 10) {
                            setSelectedLanguages([...selectedLanguages, code]);
                          } else if (!e.target.checked) {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== code));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="font-mono">{code.toUpperCase()}</span>
                      <span>{languageNames[code]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-blue-700">
                  <strong>Test Words:</strong> {testWords.join(', ')}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Voice Settings:</strong> Female, Normal speed, Neutral pitch
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={generateTestBatch}
                  disabled={isGenerating || selectedLanguages.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : `Test ${selectedLanguages.length} Languages`}
                </button>

                {isGenerating && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-600">
                      {currentProgress}/{totalTests} tests completed
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">📊 Test Results</h3>
                <div className="text-sm bg-white px-3 py-1 rounded-full border">
                  Success Rate: {getSuccessRate()}%
                </div>
              </div>

              <div className="grid gap-4">
                {selectedLanguages.map(langCode => {
                  const langResults = getLanguageResults(langCode);
                  const langSuccessRate = langResults.length > 0 
                    ? Math.round((langResults.filter(r => r.success).length / langResults.length) * 100)
                    : 0;

                  return (
                    <div key={langCode} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                            {langCode.toUpperCase()}
                          </span>
                          <span className="font-medium">{languageNames[langCode] || langCode}</span>
                        </div>
                        <div className={`text-sm px-2 py-1 rounded ${
                          langSuccessRate === 100 ? 'bg-green-100 text-green-800' :
                          langSuccessRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {langSuccessRate}% success
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {testWords.map(word => {
                          const result = langResults.find(r => r.word === word);
                          return (
                            <div key={word} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              {result?.success ? (
                                <>
                                  <span className="text-green-600">✅</span>
                                  <span className="text-sm flex-1">{word}</span>
                                  {result.audioUrl && (
                                    <button
                                      onClick={() => playAudio(result.audioUrl!)}
                                      className="text-blue-600 hover:text-blue-800 text-xs"
                                      title="Play audio"
                                    >
                                      🔊
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="text-red-600">❌</span>
                                  <span className="text-sm flex-1">{word}</span>
                                  {result?.error && (
                                    <span className="text-xs text-red-500" title={result.error}>
                                      ⚠️
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
