const { chromium } = require('playwright-core');

async function testRealtimeUpdate() {
  console.log('🔄 SubChatリアルタイム更新テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor polling and refresh logs
  const updateLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    updateLogs.push(text);
    
    if (text.includes('🔄') || text.includes('📜') || 
        text.includes('Refreshing') || text.includes('polling') ||
        text.includes('Message count changed')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(10000);
    
    // Select Agent 1 session
    await page.click('text=main1');
    await page.waitForTimeout(8000);
    
    // Count initial messages
    const initialMessageCount = await page.evaluate(() => {
      const messageElements = document.querySelectorAll('[style*="border-left"]');
      return messageElements.length;
    });
    
    console.log(`📊 初期メッセージ数: ${initialMessageCount}`);
    
    // Send test message
    const testMessage = `🔄 Realtime Update Test ${new Date().toLocaleTimeString()}`;
    
    await page.fill('input[type="text"]', testMessage);
    await page.waitForTimeout(1000);
    
    console.log(`📤 メッセージ送信: "${testMessage}"`);
    await page.click('text=Send');
    
    console.log('⏰ 自動更新待機 (15秒)...');
    await page.waitForTimeout(15000);
    
    // Count messages after sending
    const afterSendCount = await page.evaluate(() => {
      const messageElements = document.querySelectorAll('[style*="border-left"]');
      return messageElements.length;
    });
    
    console.log(`📊 送信後メッセージ数: ${afterSendCount}`);
    const sendSuccess = afterSendCount > initialMessageCount;
    console.log(`🎯 送信メッセージ自動表示: ${sendSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Test agent response detection
    console.log('🤖 エージェント返信テスト...');
    
    const followUpMessage = "Please respond with a simple 'OK' message.";
    await page.fill('input[type="text"]', followUpMessage);
    await page.waitForTimeout(1000);
    
    console.log(`📤 フォローアップメッセージ: "${followUpMessage}"`);
    await page.click('text=Send');
    
    console.log('⏰ エージェント応答 + 自動更新待機 (30秒)...');
    await page.waitForTimeout(30000);
    
    // Count final messages
    const finalMessageCount = await page.evaluate(() => {
      const messageElements = document.querySelectorAll('[style*="border-left"]');
      
      // Also look for recent "OK" responses
      let foundOkResponse = false;
      for (const element of messageElements) {
        if (element.textContent && element.textContent.includes('OK')) {
          foundOkResponse = true;
          break;
        }
      }
      
      return {
        count: messageElements.length,
        foundOkResponse
      };
    });
    
    console.log(`📊 最終メッセージ数: ${finalMessageCount.count}`);
    console.log(`🤖 OK応答検出: ${finalMessageCount.foundOkResponse ? '✅' : '❌'}`);
    
    const agentResponseSuccess = finalMessageCount.count > afterSendCount;
    console.log(`🔄 エージェント応答自動表示: ${agentResponseSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    const overallSuccess = sendSuccess && agentResponseSuccess;
    console.log(`\n🏆 リアルタイム更新総合判定: ${overallSuccess ? '🎉 完全成功!' : '⚠️ 部分的成功'}`);
    
    await page.screenshot({ path: 'subchat-realtime-test.png', fullPage: true });
    console.log('📸 結果: subchat-realtime-test.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 リアルタイム更新ログ:');
    const realtimeLogs = updateLogs.filter(log => 
      log.includes('🔄') || log.includes('📜') || 
      log.includes('Refreshing') || log.includes('polling')
    ).slice(-10);
    
    if (realtimeLogs.length > 0) {
      realtimeLogs.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (リアルタイム更新ログなし)');
    }
  }
}

testRealtimeUpdate().catch(console.error);
