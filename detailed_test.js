const { chromium } = require('playwright-core');

(async () => {
  console.log('🔍 Detailed subchat testing...');
  
  try {
    const browser = await chromium.launch({
      executablePath: '/run/current-system/sw/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Console message monitoring
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Network request monitoring 
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });
    
    console.log('📡 Loading subchat...');
    await page.goto('http://localhost:3001', { 
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });
    
    console.log('✅ Page loaded');
    console.log('📄 Title:', await page.title());
    
    // Wait for React to initialize
    console.log('⏳ Waiting for React initialization...');
    await page.waitForTimeout(3000);
    
    // Check for React components
    const reactElements = await page.evaluate(() => {
      const elements = [];
      
      // Look for common React/subchat elements
      const selectors = [
        '[data-testid]',
        '.connection-status',
        '.session-list', 
        '.chat-view',
        'button',
        'input',
        '[class*="react"]',
        '[class*="subchat"]'
      ];
      
      selectors.forEach(selector => {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          elements.push(`${selector}: ${found.length} elements`);
        }
      });
      
      return elements;
    });
    
    console.log('🔍 React elements found:');
    reactElements.forEach(elem => console.log(`  - ${elem}`));
    
    // Check for error messages
    const errors = await page.evaluate(() => {
      const errorSelectors = [
        '.error',
        '.alert',
        '[class*="error"]',
        '[class*="warning"]'
      ];
      
      const foundErrors = [];
      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.textContent.trim()) {
            foundErrors.push(el.textContent.trim());
          }
        });
      });
      
      return foundErrors;
    });
    
    if (errors.length > 0) {
      console.log('⚠️ Errors found:');
      errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No UI errors detected');
    }
    
    // Take detailed screenshot
    console.log('📸 Taking detailed screenshot...');
    await page.screenshot({ 
      path: 'subchat-detailed-test.png', 
      fullPage: true 
    });
    
    // Show console messages
    if (consoleMessages.length > 0) {
      console.log('📝 Console messages:');
      consoleMessages.slice(0, 10).forEach(msg => console.log(`  ${msg}`));
      if (consoleMessages.length > 10) {
        console.log(`  ... and ${consoleMessages.length - 10} more`);
      }
    }
    
    // Show network requests
    if (networkRequests.length > 0) {
      console.log('🌐 Network requests:');
      networkRequests.slice(0, 5).forEach(req => console.log(`  ${req}`));
      if (networkRequests.length > 5) {
        console.log(`  ... and ${networkRequests.length - 5} more`);
      }
    }
    
    await browser.close();
    console.log('✅ Detailed test completed');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
})();
