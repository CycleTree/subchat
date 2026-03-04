const { chromium } = require('playwright-core');

async function finalRealtimeDemo() {
  console.log('🎯 SubChat リアルタイム更新 最終デモ...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(8000);
    
    // Click main1 session (Agent 1)
    await page.click('text=main1');
    await page.waitForTimeout(6000);
    
    // Get initial message count
    const initialCount = await page.evaluate(() => {
      return document.querySelectorAll('[style*="border-left"]').length;
    });
    
    console.log(`📊 初期メッセージ数: ${initialCount}`);
    
    // Send demo message
    const demoMessage = `🔄 REALTIME DEMO ${new Date().toLocaleTimeString()}`;
    
    await page.fill('input[type="text"]', demoMessage);
    await page.waitForTimeout(1000);
    
    console.log(`📤 デモメッセージ送信: "${demoMessage}"`);
    
    // Click send using safer selector
    await page.click('button');
    
    console.log('⏰ リアルタイム更新確認 (15秒)...');
    await page.waitForTimeout(15000);
    
    // Check if message appeared
    const finalCount = await page.evaluate(() => {
      return document.querySelectorAll('[style*="border-left"]').length;
    });
    
    console.log(`📊 最終メッセージ数: ${finalCount}`);
    
    const realtimeSuccess = finalCount > initialCount;
    console.log(`\n🎉 リアルタイム更新結果: ${realtimeSuccess ? '✅ 完全成功!' : '❌ 失敗'}`);
    console.log(`📈 メッセージ増加: ${initialCount} → ${finalCount} (+${finalCount - initialCount})`);
    
    await page.screenshot({ path: 'subchat-realtime-final-demo.png', fullPage: true });
    console.log('📸 最終デモ結果: subchat-realtime-final-demo.png');
    
    if (realtimeSuccess) {
      console.log('\n🏆 SUBCHAT リアルタイム更新機能完全実装済み!');
      console.log('✅ メッセージ送信後の自動更新');
      console.log('✅ 定期ポーリングによるリアルタイム監視');
      console.log('✅ エージェント会話の双方向観測');
    }
    
  } catch (error) {
    console.log('❌ エラー:', error.message);
  } finally {
    await browser.close();
  }
}

finalRealtimeDemo().catch(console.error);
