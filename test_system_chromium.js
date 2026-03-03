const { chromium } = require('playwright-core');

(async () => {
  console.log('🎭 Testing Playwright with System Chromium (Enhanced)...');
  console.log('System Chromium path: /run/current-system/sw/bin/chromium');
  
  try {
    console.log('🚀 Launching system Chromium...');
    const browser = await chromium.launch({
      executablePath: '/run/current-system/sw/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ]
    });
    
    console.log('✅ Browser launched successfully!');
    
    // Add a small delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const page = await browser.newPage();
    console.log('✅ Page created');
    
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    console.log('✅ Viewport set');
    
    // Navigate to subchat
    console.log('📡 Loading subchat app...');
    await page.goto('http://localhost:3001', { 
      timeout: 15000,
      waitUntil: 'domcontentloaded'
    });
    console.log('✅ Page loaded successfully');
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'subchat-system-chromium.png', 
      fullPage: true 
    });
    console.log('✅ Screenshot saved: subchat-system-chromium.png');
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    await browser.close();
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.stack) {
      console.log('📍 Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
})();
