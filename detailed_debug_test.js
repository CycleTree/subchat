const { chromium } = require('playwright-core');

async function detailedDebugTest() {
  console.log('🔍 Optimistic UI 詳細デバッグテスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor all optimistic UI related logs
  const allLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    allLogs.push(text);
    
    // Show key logs immediately
    if (text.includes('💬 handleSendMessage') || 
        text.includes('⚡ Adding optimistic') ||
        text.includes('⚡ Pending messages updated') ||
        text.includes('⚡ Input cleared') ||
        text.includes('⏳ Rendering pending') ||
        text.includes('Pending:')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(8000);
    
    // Select main1 session  
    await page.click('text=main1');
    await page.waitForTimeout(6000);
    
    console.log('\n🧪 Optimistic UI 詳細テスト開始...');
    
    const testMessage = `🔍 Debug Test ${Date.now()}`;
    
    // Type message
    await page.fill('input[type="text"]', testMessage);
    await page.waitForTimeout(1000);
    
    console.log(`📤 テストメッセージ: "${testMessage}"`);
    console.log('🖱️ Sendボタンクリック...');
    
    // Send and immediately check state
    await page.click('button');
    
    // Check immediate state after 50ms
    await page.waitForTimeout(50);
    
    const immediateState = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      const debugDiv = document.querySelector('div[style*="font-size: 10px"]');
      
      return {
        inputValue: input?.value || '',
        debugText: debugDiv?.textContent || '',
        hasPendingInDebug: (debugDiv?.textContent || '').includes('Pending:')
      };
    });
    
    console.log('⚡ 50ms後の即座状態:');
    console.log(`  - 入力値: "${immediateState.inputValue}"`);
    console.log(`  - Pending表示: ${immediateState.hasPendingInDebug ? '✅' : '❌'}`);
    console.log(`  - Debug情報: ${immediateState.debugText}`);
    
    // Wait a bit more and check again
    await page.waitForTimeout(2000);
    
    const afterDelayState = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      const debugDiv = document.querySelector('div[style*="font-size: 10px"]');
      
      return {
        inputValue: input?.value || '',
        debugText: debugDiv?.textContent || '',
        pendingInfo: (debugDiv?.textContent || '').match(/Pending: (\d+)/) || []
      };
    });
    
    console.log('\n📊 2秒後の状態:');
    console.log(`  - 入力値: "${afterDelayState.inputValue}"`);
    console.log(`  - Pending数: ${afterDelayState.pendingInfo[1] || '0'}`);
    console.log(`  - Debug情報: ${afterDelayState.debugText}`);
    
    // Wait for server response
    await page.waitForTimeout(8000);
    
    const finalState = await page.evaluate(() => {
      const debugDiv = document.querySelector('div[style*="font-size: 10px"]');
      return {
        debugText: debugDiv?.textContent || ''
      };
    });
    
    console.log('\n📈 最終状態:');
    console.log(`  - Debug情報: ${finalState.debugText}`);
    
    await page.screenshot({ path: 'optimistic-ui-debug.png' });
    console.log('📸 デバッグ結果: optimistic-ui-debug.png');
    
  } catch (error) {
    console.log('❌ デバッグエラー:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 Optimistic UI 関連ログ:');
    const optimisticLogs = allLogs.filter(log => 
      log.includes('💬 handleSendMessage') ||
      log.includes('⚡') ||
      log.includes('⏳ Rendering pending') ||
      log.includes('Pending messages updated') ||
      log.includes('setPendingMessages')
    );
    
    if (optimisticLogs.length > 0) {
      optimisticLogs.slice(-10).forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (Optimistic UI ログなし - 問題あり)');
    }
  }
}

detailedDebugTest().catch(console.error);
