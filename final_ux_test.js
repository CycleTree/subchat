const { chromium } = require('playwright-core');

async function finalUXTest() {
  console.log('🎯 最終UX修正テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor key UX logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('💬 handleSendMessage') || 
        text.includes('⚡') ||
        text.includes('Pending:') ||
        text.includes('🖱️ Send button clicked')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(8000);
    
    // Select main1 session
    await page.click('text=main1');
    await page.waitForTimeout(6000);
    
    // Type test message
    const testMessage = '🎯 Final UX Test';
    await page.fill('input[type="text"]', testMessage);
    await page.waitForTimeout(1000);
    
    console.log(`📤 テストメッセージ: "${testMessage}"`);
    
    // Click the correct Send button (second button)
    console.log('🖱️ 正しいSendボタン(2番目)クリック...');
    await page.click('button:nth-of-type(2)');
    
    console.log('⚡ 送信直後チェック (500ms)...');
    await page.waitForTimeout(500);
    
    // Check immediate state  
    const immediateState = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      const debugDiv = document.querySelector('div[style*="font-size: 10px"]');
      
      return {
        inputCleared: input?.value === '',
        debugText: debugDiv?.textContent || '',
        hasPending: (debugDiv?.textContent || '').includes('Pending:')
      };
    });
    
    console.log(`🔄 入力即座クリア: ${immediateState.inputCleared ? '✅' : '❌'}`);
    console.log(`⏳ Pending表示: ${immediateState.hasPending ? '✅' : '❌'}`);
    
    // Wait for server sync
    console.log('⏰ サーバー同期待機 (8秒)...');
    await page.waitForTimeout(8000);
    
    const finalState = await page.evaluate(() => {
      const debugDiv = document.querySelector('div[style*="font-size: 10px"]');
      return {
        debugText: debugDiv?.textContent || ''
      };
    });
    
    console.log(`📊 最終状態: ${finalState.debugText}`);
    
    const uxSuccess = immediateState.inputCleared;
    console.log(`\n🏆 UX改善結果: ${uxSuccess ? '🎉 成功!' : '❌ 失敗'}`);
    
    await page.screenshot({ path: 'final-ux-test-result.png' });
    console.log('📸 最終UX結果: final-ux-test-result.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
}

finalUXTest().catch(console.error);
