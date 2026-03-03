const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Playwright browser test...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('🖥️ Browser console:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });
  
  try {
    console.log('📡 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'screenshot-1-initial.png', fullPage: true });
    
    // Wait a bit for React to load
    await page.waitForTimeout(2000);
    
    console.log('📸 Taking loaded screenshot...');
    await page.screenshot({ path: 'screenshot-2-loaded.png', fullPage: true });
    
    // Check for specific elements
    const title = await page.textContent('h1');
    console.log('📝 Page title:', title);
    
    // Check connection status
    const statusElement = await page.$('[style*="border-radius: 50%"]');
    if (statusElement) {
      const styles = await statusElement.getAttribute('style');
      console.log('🔗 Connection status styles:', styles);
    }
    
    // Wait a bit more for WebSocket to attempt connection
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ path: 'screenshot-3-final.png', fullPage: true });
    
    // Check for any sessions
    const sessionElements = await page.$$('button');
    console.log(`📋 Found ${sessionElements.length} button elements`);
    
    // Get all text content
    const bodyText = await page.textContent('body');
    console.log('📄 Page content preview:', bodyText.substring(0, 200) + '...');
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
  }
  
  await browser.close();
  console.log('✅ Browser test completed');
})();
