// Debug helper - run this in browser console to test Alnilam
console.log('🧪 Alnilam Audio Debug Test Starting...');

// Test 1: Check if API endpoint is accessible
const testApiEndpoint = async () => {
  try {
    console.log('🌐 Testing API endpoint...');
    const response = await fetch('/api/alnilam-audio?wordId=2682&languageCode=it');
    console.log('✅ API Response Status:', response.status);
    if (response.ok) {
      console.log('🎵 API endpoint is working!');
      return true;
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return false;
  }
};

// Test 2: Check if audio can be played directly
const testDirectAudio = async () => {
  try {
    console.log('🎵 Testing direct audio playback...');
    const audioUrl = '/api/alnilam-audio?wordId=2682&languageCode=it';
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      audio.onloadeddata = () => {
        console.log('✅ Audio loaded successfully');
        audio.play().then(() => {
          console.log('✅ Audio playing successfully');
          resolve(true);
        }).catch((error) => {
          console.error('❌ Audio play failed:', error);
          resolve(false);
        });
      };
      
      audio.onerror = (error) => {
        console.error('❌ Audio load failed:', error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('❌ Direct Audio Test Failed:', error);
    return false;
  }
};

// Run tests
const runAllTests = async () => {
  console.log('🚀 Running Alnilam diagnostic tests...');
  
  const apiTest = await testApiEndpoint();
  console.log('📊 API Test Result:', apiTest);
  
  if (apiTest) {
    const audioTest = await testDirectAudio();
    console.log('📊 Audio Test Result:', audioTest);
  }
  
  console.log('🏁 Diagnostic tests completed');
};

// Auto-run after 2 seconds
setTimeout(runAllTests, 2000);

// Export for manual testing
window.testAlnilam = runAllTests;
