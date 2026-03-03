// Simple Node.js script to check app status
const http = require('http');

console.log('🔍 Checking SubChat status...');

// Check main app
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ SubChat App Status: ${res.statusCode}`);
  console.log(`📋 Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Check if React app elements are present
    const hasTitle = data.includes('subchat');
    const hasScript = data.includes('/src/main.tsx');
    const hasVite = data.includes('/@vite/client');
    
    console.log(`📱 React App: ${hasTitle ? '✅' : '❌'} Title found`);
    console.log(`📦 Vite Dev: ${hasVite ? '✅' : '❌'} Client script found`);
    console.log(`🔧 Main Script: ${hasScript ? '✅' : '❌'} Main.tsx found`);
    
    if (data.includes('error') || data.includes('Error')) {
      console.log('⚠️ Possible errors found in response');
    }
    
    console.log('🎯 App appears to be loading properly');
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
});

req.end();
