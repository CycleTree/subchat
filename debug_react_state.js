const { chromium } = require('playwright-core');

async function debugReactState() {
  console.log('🔍 React State デバッグ...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor state changes
  const stateChanges = [];
  page.on('console', msg => {
    const text = msg.text();
    
    if (text.includes('ChatStore') || 
        text.includes('subscribe') ||
        text.includes('notifyListeners') ||
        text.includes('setState') ||
        text.includes('Zustand') ||
        text.includes('sessions') ||
        text.includes('State:')) {
      stateChanges.push(`[${msg.type()}] ${text}`);
      console.log(`🔍 ${text}`);
    }
  });
  
  // Add debug injection
  await page.addInitScript(() => {
    // Hook into Zustand store
    window.__SUBCHAT_DEBUG__ = {
      stateHistory: [],
      logState: function(label, state) {
        console.log(`🔍 State: ${label}`, state);
        this.stateHistory.push({label, state: JSON.parse(JSON.stringify(state)), ts: Date.now()});
      }
    };
  });
  
  try {
    console.log('📡 SubChat アクセス (React state監視)...');
    await page.goto('http://localhost:3000');
    
    console.log('⏰ 20秒待機でstate変化を監視...');
    await page.waitForTimeout(20000);
    
    // Check current Zustand state
    const zustandState = await page.evaluate(() => {
      // Try to access the store directly
      try {
        return new Promise((resolve) => {
          setTimeout(() => {
            // Look for Zustand store in global scope or window
            const stores = [];
            for (const key of Object.keys(window)) {
              if (key.includes('store') || key.includes('Store')) {
                stores.push(key);
              }
            }
            
            resolve({
              foundStores: stores,
              debugHistory: window.__SUBCHAT_DEBUG__?.stateHistory || [],
              reactDevTools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
            });
          }, 1000);
        });
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('\n🔍 Zustand State分析:', zustandState);
    
    // Manual state inspection via DOM
    const domInspection = await page.evaluate(() => {
      // Find React components via DOM
      const sessionElements = document.querySelectorAll('[class*="session"]');
      const sessionListElement = document.querySelector('div:has(h3)');
      
      return {
        sessionElements: sessionElements.length,
        hasSessionListComponent: !!sessionListElement,
        sessionListHTML: sessionListElement?.innerHTML || 'not found',
        fullBodyText: document.body.textContent,
        divCount: document.querySelectorAll('div').length,
        hasActiveSessionsHeading: document.body.textContent.includes('Active Sessions')
      };
    });
    
    console.log('\n🔍 DOM Inspection:', domInspection);
    
  } catch (error) {
    console.log('❌ Debug error:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 State変化ログ:');
    if (stateChanges.length > 0) {
      stateChanges.forEach((change, i) => {
        console.log(`  ${i + 1}: ${change}`);
      });
    } else {
      console.log('  (state変化ログなし)');
    }
  }
}

debugReactState().catch(console.error);
