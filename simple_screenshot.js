const { chromium } = require('playwright-core');

(async () => {
  console.log('🎭 Taking subchat screenshot with system Chromium...');
  
  try {
    const browser = await chromium.launch({
      executablePath: '/run/current-system/sw/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('📡 Loading subchat...');
    await page.goto('http://localhost:3001', { 
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'subchat-screenshot.png', 
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: subchat-screenshot.png');
    
    await browser.close();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
