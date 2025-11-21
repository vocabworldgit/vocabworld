// Debug script to test Umbriel audio loading and playback
console.log('🎵 Debug: Testing Umbriel Audio System');

// Test 1: Check if manifest loads
async function testManifestLoad() {
  console.log('📋 Test 1: Loading manifest...');
  try {
    const response = await fetch('/audio/greetings-manifest.json');
    if (!response.ok) {
      console.error('❌ Manifest fetch failed:', response.status, response.statusText);
      return null;
    }
    const manifest = await response.json();
    console.log('✅ Manifest loaded successfully:', manifest);
    return manifest;
  } catch (error) {
    console.error('❌ Manifest load error:', error);
    return null;
  }
}

// Test 2: Check if audio files exist and can be loaded
async function testAudioFile(filename) {
  console.log(`🎵 Test 2: Testing audio file: ${filename}`);
  try {
    const audioPath = `/audio/en/${filename}`;
    const audio = new Audio(audioPath);
    
    return new Promise((resolve) => {
      audio.oncanplaythrough = () => {
        console.log(`✅ Audio file loaded successfully: ${filename}`);
        resolve(true);
      };
      
      audio.onerror = (error) => {
        console.error(`❌ Audio file failed to load: ${filename}`, error);
        resolve(false);
      };
      
      // Set a timeout to avoid hanging
      setTimeout(() => {
        console.warn(`⏰ Audio file load timeout: ${filename}`);
        resolve(false);
      }, 5000);
      
      audio.load();
    });
  } catch (error) {
    console.error(`❌ Audio file test error for ${filename}:`, error);
    return false;
  }
}

// Test 3: Test actual playback
async function testAudioPlayback(filename) {
  console.log(`🔊 Test 3: Testing playback for: ${filename}`);
  try {
    const audioPath = `/audio/en/${filename}`;
    const audio = new Audio(audioPath);
    
    return new Promise((resolve) => {
      audio.onended = () => {
        console.log(`✅ Audio playback completed: ${filename}`);
        resolve(true);
      };
      
      audio.onerror = (error) => {
        console.error(`❌ Audio playback failed: ${filename}`, error);
        resolve(false);
      };
      
      audio.oncanplaythrough = () => {
        console.log(`🎵 Playing audio: ${filename}`);
        audio.play().catch(error => {
          console.error(`❌ Play() failed for ${filename}:`, error);
          resolve(false);
        });
      };
      
      audio.load();
    });
  } catch (error) {
    console.error(`❌ Audio playback test error for ${filename}:`, error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Umbriel Audio Debug Tests...');
  
  // Test manifest loading
  const manifest = await testManifestLoad();
  if (!manifest) {
    console.error('🚫 Cannot proceed without manifest');
    return;
  }
  
  // Test a few audio files
  const testFiles = [
    '2682-hello-en.wav',
    '2683-good-morning-en.wav',
    '2684-good-evening-en.wav'
  ];
  
  console.log('📋 Testing audio file loading...');
  for (const file of testFiles) {
    await testAudioFile(file);
  }
  
  console.log('🔊 Testing audio playback...');
  // Test playback of first file only
  await testAudioPlayback(testFiles[0]);
  
  console.log('🎯 Debug tests completed');
}

// Check if HybridAudioService exists
if (window.HybridAudioService) {
  console.log('✅ HybridAudioService is available');
} else {
  console.log('❌ HybridAudioService not found in window');
}

// Run tests
runAllTests();
