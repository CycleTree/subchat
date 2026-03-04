const { chromium } = require('playwright-core');

(async () => {
  console.log('🔌 WebSocket connection testing...');
  
  try {
    const browser = await chromium.launch({
      executablePath: '/run/current-system/sw/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Monitor console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    console.log('📡 Loading subchat...');
    await page.goto('http://localhost:3000', { 
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });
    
    console.log('⏳ Waiting for WebSocket authentication process...');
    await page.waitForTimeout(8000);
    
    // Check WebSocket status in the browser
    const wsStatus = await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const status = {
            wsConnected: window.__SUBCHAT_WS_STATE__ || 'unknown',
            localStorage: Object.keys(localStorage).length > 0 ? Object.fromEntries(Object.entries(localStorage)) : {},
            errors: window.__SUBCHAT_ERRORS__ || []
          };
          resolve(status);
        }, 1000);
      });
    });
    
    console.log('🔌 WebSocket Status:', JSON.stringify(wsStatus, null, 2));
    
    // Show last 20 console messages for authentication debugging
    console.log('\n📝 Console messages (last 20):');
    const recentMessages = consoleMessages.slice(-20);
    recentMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}: ${msg}`);
    });
    
    // Check the current page content for any status indicators
    const pageContent = await page.evaluate(() => {
      const body = document.body;
      const textContent = body ? body.textContent : 'No body found';
      
      // Look for specific subchat UI elements
      const elements = {
        sessionList: !!document.querySelector('.session-list, [class*="session"]'),
        chatView: !!document.querySelector('.chat-view, [class*="chat"]'),  
        connectionStatus: !!document.querySelector('.connection-status, [class*="connection"]'),
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        hasContent: textContent.length > 100
      };
      
      return {
        elements,
        textLength: textContent.length,
        title: document.title
      };
    });
    
    console.log('\n🔍 Page analysis:', JSON.stringify(pageContent, null, 2));
    
    await browser.close();
    console.log('\n✅ WebSocket test completed');
    
  } catch (error) {
    console.log('❌ WebSocket test failed:', error.message);
  }
})();
