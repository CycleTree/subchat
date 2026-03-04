const { chromium } = require('playwright-core');

async function debugUIConnection() {
  console.log('🔍 SubChat UI接続デバッグ...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // コンソールログを監視
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // WebSocketエラーを監視
  page.on('requestfailed', request => {
    consoleLogs.push(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('📡 SubChatにアクセス...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // WebSocket接続を十分待つ
    console.log('⏰ WebSocket接続を10秒待機...');
    await page.waitForTimeout(10000);
    
    // React Stateを詳しく調査
    const debugInfo = await page.evaluate(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          // グローバル状態をチェック
          const result = {
            windowVars: Object.keys(window).filter(key => key.includes('subchat') || key.includes('store') || key.includes('ws')),
            localStorage: Object.keys(localStorage).length > 0 ? Object.fromEntries(Object.entries(localStorage)) : {},
            sessionStorage: Object.keys(sessionStorage).length > 0 ? Object.fromEntries(Object.entries(sessionStorage)) : {},
            hasReact: !!window.React,
            bodyClasses: document.body.className,
            wsState: window.__SUBCHAT_WS_STATE__ || 'not found',
            errors: window.__SUBCHAT_ERRORS__ || []
          };
          resolve(result);
        }, 1000);
      });
    });
    
    console.log('🔍 ブラウザ状態:', JSON.stringify(debugInfo, null, 2));
    
    // DOMの詳細分析
    const domAnalysis = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const elementCounts = {};
      
      Array.from(allElements).forEach(el => {
        const tag = el.tagName.toLowerCase();
        elementCounts[tag] = (elementCounts[tag] || 0) + 1;
      });
      
      return {
        totalElements: allElements.length,
        elementCounts: Object.keys(elementCounts).sort().reduce((sorted, key) => {
          sorted[key] = elementCounts[key];
          return sorted;
        }, {}),
        scripts: Array.from(document.scripts).map(script => ({
          src: script.src || 'inline',
          content: script.src ? 'external' : script.innerHTML.substring(0, 100) + '...'
        })),
        hasErrors: document.body.textContent.toLowerCase().includes('error')
      };
    });
    
    console.log('🔍 DOM分析:', JSON.stringify(domAnalysis, null, 2));
    
    // Network requests確認
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        type: request.resourceType()
      });
    });
    
    page.on('response', response => {
      if (response.url().includes('gateway') || response.url().includes('ws')) {
        consoleLogs.push(`[NETWORK] ${response.status()} ${response.url()}`);
      }
    });
    
    // 手動でリフレッシュを試行
    const refreshResult = await page.evaluate(() => {
      // リフレッシュボタンを探してクリック
      const refreshButtons = document.querySelectorAll('button');
      for (const btn of refreshButtons) {
        if (btn.textContent.includes('Refresh') || btn.textContent.includes('Reload')) {
          btn.click();
          return `Clicked refresh button: ${btn.textContent}`;
        }
      }
      return 'No refresh button found';
    });
    
    console.log('🔄 リフレッシュ試行:', refreshResult);
    
    // さらに5秒待ってから再確認
    await page.waitForTimeout(5000);
    
    const finalCheck = await page.evaluate(() => {
      return {
        pageText: document.body.textContent,
        sessionElements: document.querySelectorAll('[class*="session"], .session-item, li').length,
        buttonElements: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim()),
        inputElements: Array.from(document.querySelectorAll('input')).map(inp => inp.placeholder || inp.value),
        hasConnectionStatus: !!document.querySelector('[class*="connect"]')
      };
    });
    
    console.log('🏁 最終確認:', JSON.stringify(finalCheck, null, 2));
    
  } catch (error) {
    console.log('❌ デバッグ中にエラー:', error.message);
  } finally {
    // 全てのコンソールログを出力
    console.log('\n📝 ブラウザコンソールログ:');
    consoleLogs.forEach((log, i) => {
      console.log(`  ${i + 1}: ${log}`);
    });
    
    // スクリーンショット保存
    await page.screenshot({ path: 'subchat-debug.png' });
    console.log('📸 デバッグスクリーンショット: subchat-debug.png');
    
    await browser.close();
  }
}

debugUIConnection().catch(console.error);
