const { chromium } = require('playwright-core');

async function uxExperienceTest() {
  console.log('🎮 SubChat UX体感テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor key UX logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('pending') || text.includes('Pending:') || text.includes('immediately') ||
        text.includes('Rendering') && text.includes('pending') || text.includes('scroll')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(8000);
    
    // Select main1 session (Agent 1)
    await page.click('text=main1');
    await page.waitForTimeout(6000);
    
    console.log('🎯 UX体感テスト開始...');
    
    // Test immediate feedback
    const testMessage = `🎮 UX Experience Test ${new Date().toLocaleTimeString()}`;
    
    console.log(`📤 テストメッセージ: "${testMessage}"`);
    await page.fill('input[type="text"]', testMessage);
    await page.waitForTimeout(500);
    
    // Click send and immediately check for optimistic UI
    await page.click('button');
    
    console.log('⚡ 送信直後 (100ms後) の状態確認...');
    await page.waitForTimeout(100);
    
    // Check immediate state
    const immediateState = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      const debugInfo = document.querySelector('div[style*="font-size: 10px"]');
      return {
        inputCleared: input?.value === '',
        debugText: debugInfo?.textContent || '',
        bodyContainsPending: document.body.textContent?.includes('Pending:') || false
      };
    });
    
    console.log(`🔄 入力即座クリア: ${immediateState.inputCleared ? '✅' : '❌'}`);
    console.log(`⏳ Pending表示: ${immediateState.bodyContainsPending ? '✅' : '❌'}`);
    console.log(`🔍 Debug: ${immediateState.debugText}`);
    
    // Wait a bit longer to see if optimistic UI appears
    await page.waitForTimeout(2000);
    
    const afterWaitState = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      const debugInfo = document.querySelector('div[style*="font-size: 10px"]');
      return {
        inputValue: input?.value || '',
        debugText: debugInfo?.textContent || '',
        pendingCount: (debugInfo?.textContent?.match(/Pending: (\d+)/) || [])[1] || '0'
      };
    });
    
    console.log(`📊 2秒後 Pending数: ${afterWaitState.pendingCount}`);
    console.log(`📝 入力値: "${afterWaitState.inputValue}"`);
    
    // Wait for server sync and auto-scroll
    console.log('⏰ サーバー同期 & auto-scroll 確認 (10秒)...');
    await page.waitForTimeout(10000);
    
    // Test multiple quick sends for scroll behavior
    console.log('📜 連続送信でスクロール動作テスト...');
    
    for (let i = 1; i <= 3; i++) {
      const quickMessage = `📜 Quick ${i}/3`;
      await page.fill('input[type="text"]', quickMessage);
      await page.waitForTimeout(300);
      
      console.log(`📤 連続送信 ${i}: "${quickMessage}"`);
      await page.click('button');
      await page.waitForTimeout(1500);
    }
    
    console.log('⏰ 最終同期待機...');
    await page.waitForTimeout(8000);
    
    // Check final scroll position
    const scrollState = await page.evaluate(() => {
      const container = document.querySelector('div[style*="overflow: auto"]');
      if (!container) return { error: 'No scroll container found' };
      
      const isAtBottom = Math.abs(
        (container.scrollTop + container.clientHeight) - container.scrollHeight
      ) < 100; // Allow 100px tolerance
      
      return {
        scrollTop: container.scrollTop,
        clientHeight: container.clientHeight, 
        scrollHeight: container.scrollHeight,
        isAtBottom,
        tolerance: Math.abs((container.scrollTop + container.clientHeight) - container.scrollHeight)
      };
    });
    
    console.log('📜 最終スクロール状態:');
    console.log(`  - ScrollTop: ${scrollState.scrollTop}`);
    console.log(`  - ClientHeight: ${scrollState.clientHeight}`); 
    console.log(`  - ScrollHeight: ${scrollState.scrollHeight}`);
    console.log(`  - 最下部到達: ${scrollState.isAtBottom ? '✅' : '❌'} (tolerance: ${scrollState.tolerance}px)`);
    
    const overallUXSuccess = immediateState.inputCleared && scrollState.isAtBottom;
    console.log(`\n🏆 UX体感テスト結果: ${overallUXSuccess ? '🎉 優秀!' : '⚠️ 改善余地あり'}`);
    
    await page.screenshot({ path: 'subchat-ux-experience-final.png', fullPage: true });
    console.log('📸 最終UX体感結果: subchat-ux-experience-final.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
}

uxExperienceTest().catch(console.error);
