'use client';

import React, { useState } from 'react';

export function AzureTTSDirectTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');

  const testAzureTTS = async () => {
    setIsLoading(true);
    setTestResult('');
    setAudioUrl('');

    try {
      // Check if Azure Speech SDK is available
      if (typeof window === 'undefined') {
        setTestResult('❌ Not in browser environment');
        return;
      }

      // Dynamic import of Azure Speech SDK
      const sdk = await import('microsoft-cognitiveservices-speech-sdk');
      
      const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
      const region = process.env.NEXT_PUBLIC_AZURE_REGION;

      if (!speechKey || !region) {
        setTestResult('❌ Azure credentials not found. Please set NEXT_PUBLIC_AZURE_SPEECH_KEY and NEXT_PUBLIC_AZURE_REGION in your environment.');
        return;
      }

      setTestResult('🔧 Initializing Azure Speech...');

      // Create speech config
      const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region);
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

      setTestResult('🎤 Creating synthesizer...');

      // Create synthesizer with null audio config to get audio data
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

      const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="sv-SE">
  <voice name="sv-SE-SofieNeural">
    <prosody rate="1.0" pitch="medium">
      <break time="200ms"/>
      hej
      <break time="200ms"/>
    </prosody>
  </voice>
</speak>
      `.trim();

      setTestResult('🔊 Generating speech...');

      const result = await new Promise<any>((resolve, reject) => {
        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            console.log('🎯 Speech synthesis result:', result);
            resolve(result);
          },
          (error) => {
            console.error('❌ Speech synthesis error:', error);
            reject(error);
          }
        );
      });

      synthesizer.close();

      if (result.audioData && result.audioData.byteLength > 0) {
        console.log(`✅ Audio generated: ${result.audioData.byteLength} bytes`);
        
        // Create blob and URL for playback
        const audioBlob = new Blob([result.audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        setTestResult(`✅ Success! Generated ${result.audioData.byteLength} bytes of audio. Swedish "hej" (hello) ready to play.`);
      } else {
        setTestResult(`❌ No audio data generated. Result reason: ${result.reason}`);
        console.error('No audio data:', result);
      }

    } catch (error) {
      console.error('Azure TTS Test Error:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const playGeneratedAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((error) => {
        console.error('Playback error:', error);
        setTestResult(prev => prev + '\n❌ Playback failed: ' + error.message);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Azure TTS Direct Test</h1>
        <p className="text-gray-600">
          Simple test to verify Azure Speech synthesis is working
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-4">🧪 Direct Azure TTS Test</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-blue-700 mb-2">
              This will test generating Swedish "hej" (hello) using Azure Speech:
            </p>
            <ul className="text-xs text-blue-600 list-disc list-inside space-y-1">
              <li>Voice: sv-SE-SofieNeural (Swedish female)</li>
              <li>Word: "hej" (hello in Swedish)</li>
              <li>Format: 24kHz MP3</li>
              <li>Settings: Normal speed, neutral pitch</li>
            </ul>
          </div>

          <button
            onClick={testAzureTTS}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test Azure TTS'}
          </button>

          {testResult && (
            <div className="bg-white border border-blue-200 rounded p-4">
              <h4 className="font-medium text-blue-800 mb-2">Test Result:</h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}

          {audioUrl && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h4 className="font-medium text-green-800 mb-2">🎵 Audio Generated!</h4>
              <div className="flex items-center gap-4">
                <button
                  onClick={playGeneratedAudio}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  🔊 Play Swedish "hej"
                </button>
                <p className="text-sm text-green-700">
                  Swedish female voice saying "hello"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Environment Check:</h4>
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Azure Speech Key: {process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY ? '✅ Set' : '❌ Not set'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${process.env.NEXT_PUBLIC_AZURE_REGION ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Azure Region: {process.env.NEXT_PUBLIC_AZURE_REGION || '❌ Not set'}</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">💡 Troubleshooting:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• If credentials are missing, create a .env.local file with your Azure keys</li>
          <li>• If audio doesn't play, check browser audio permissions</li>
          <li>• If synthesis fails, verify your Azure Speech resource is active</li>
          <li>• Open browser developer console for detailed error logs</li>
        </ul>
      </div>
    </div>
  );
}
