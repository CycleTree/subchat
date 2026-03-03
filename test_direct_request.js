const { chromium } = require('playwright-core');

(async () => {
  console.log('🔌 Testing direct requests without auth challenge...');
  
  try {
    const browser = await chromium.launch({
      executablePath: '/run/current-system/sw/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Monitor console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Inject test script
    await page.evaluateOnNewDocument(() => {
      window.testDirectAuth = () => {
        const ws = new WebSocket('ws://localhost:18792/gateway?token=3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f');
        
        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          
          // Try sending direct request without waiting for auth challenge
          const request = {
            id: 1,
            method: 'sessions_list',
            params: {}
          };
          console.log('📤 Sending direct request:', request);
          ws.send(JSON.stringify(request));
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          console.log('📨 Received:', message);
          
          if (message.type === 'event' && message.event === 'connect.challenge') {
            console.log('🔐 Ignoring auth challenge, connection should be token-authenticated');
            return;
          }
          
          if (message.id === 1) {
            console.log('✅ Direct request succeeded!');
            console.log('Sessions:', message.result);
          }
        };
        
        ws.onerror = (error) => {
          console.log('❌ WebSocket error:', error);
        };
        
        ws.onclose = (event) => {
          console.log('🔌 Disconnected:', event.code, event.reason);
        };
      };
    });
    
    await page.goto('about:blank');
    
    console.log('🔗 Starting direct auth test...');
    await page.evaluate(() => window.testDirectAuth());
    
    // Wait for results
    await page.waitForTimeout(5000);
    
    console.log('\n📝 Console messages:');
    consoleMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}: ${msg}`);
    });
    
    await browser.close();
    console.log('\n✅ Direct request test completed');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
})();
