const { chromium } = require('playwright-core');

(async () => {
  console.log('🎭 Testing Playwright in buildFHSEnv...');
  console.log('Environment check:');
  console.log('- Node version:', process.version);
  console.log('- LD_LIBRARY_PATH:', process.env.LD_LIBRARY_PATH || 'not set');
  console.log('- PWD:', process.cwd());
  
  try {
    console.log('Launching Chromium...');
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    console.log('✅ Browser launched successfully!');
    
    const page = await browser.newPage();
    console.log('✅ Page created');
    
    // Navigate to subchat
    console.log('📡 Loading subchat app...');
    await page.goto('http://localhost:3000', { timeout: 5000 });
    console.log('✅ Page loaded');
    
    // Take screenshot
    await page.screenshot({ path: 'subchat-fhs-test.png', fullPage: true });
    console.log('📸 Screenshot saved: subchat-fhs-test.png');
    
    await browser.close();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.stack) {
      console.log('Stack:', error.stack.split('\n')[1]);
    }
  }
})();
