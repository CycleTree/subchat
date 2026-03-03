const { chromium } = require('playwright-core');

(async () => {
  console.log('🎭 Testing Playwright Core with NixOS nix-ld...');
  
  try {
    // Try to launch chromium with system browser
    const browser = await chromium.launch({ 
      headless: true,
      executablePath: '/run/current-system/sw/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('📱 Browser console:', msg.text());
    });
    
    // Navigate to subchat
    console.log('📡 Loading subchat app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Take screenshot
    await page.screenshot({ path: 'subchat-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: subchat-screenshot.png');
    
    // Check title
    const title = await page.title();
    console.log('📝 Page title:', title);
    
    // Check for subchat elements
    const h1 = await page.textContent('h1').catch(() => null);
    console.log('🏷️  Main heading:', h1);
    
    // Check connection status
    const statusDot = await page.$('[style*="border-radius: 50%"]').catch(() => null);
    if (statusDot) {
      const bgColor = await statusDot.evaluate(el => el.style.background);
      console.log('🔗 Connection status color:', bgColor);
    }
    
    // Wait for WebSocket attempt
    await page.waitForTimeout(3000);
    
    // Take final screenshot
    await page.screenshot({ path: 'subchat-final.png', fullPage: true });
    console.log('📸 Final screenshot saved: subchat-final.png');
    
    await browser.close();
    console.log('✅ Playwright test completed successfully');
    
  } catch (error) {
    console.log('❌ Playwright error:', error.message);
    
    // Fallback: try without specific executable
    try {
      console.log('🔄 Trying fallback approach...');
      const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
      
      const page = await browser.newPage();
      await page.goto('http://localhost:3000');
      await page.screenshot({ path: 'subchat-fallback.png' });
      console.log('📸 Fallback screenshot saved: subchat-fallback.png');
      await browser.close();
      
    } catch (fallbackError) {
      console.log('❌ Fallback also failed:', fallbackError.message);
    }
  }
})();
