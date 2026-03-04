const { chromium } = require('playwright-core');

async function testUXImprovements() {
  console.log('🎯 UX改善テスト: Auto-scroll + Optimistic UI...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor optimistic UI logs
  const uxLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    uxLogs.push(text);
    
    if (text.includes('Optimistic') || text.includes('pending') || 
        text.includes('scroll') || text.includes('Pending:') ||
        text.includes('immediately')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 改善版SubChatアクセス...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(10000);
    
    console.log('🖱️ Agent 1 セッション選択...');
    await page.click('text=main1');
    await page.waitForTimeout(8000);
    
    // Test 1: Immediate UI feedback (Optimistic UI)
    console.log('\n🧪 Test 1: Optimistic UI (即座UI反映)');
    
    const testMessage1 = `⚡ Instant UI Test ${new Date().toLocaleTimeString()}`;
    
    await page.fill('input[type="text"]', testMessage1);
    await page.waitForTimeout(1000);
    
    // Count messages before sending
    const beforeSend = await page.evaluate(() => {
      const messageElements = document.querySelectorAll('[style*="border-left"]');
      return messageElements.length;
    });
    
    console.log(`📊 送信前メッセージ数: ${beforeSend}`);
    console.log(`📤 送信メッセージ: "${testMessage1}"`);
    
    // Send message and immediately check if it appears
    await page.click('button');
    
    console.log('⚡ 送信直後のUI確認...');
    await page.waitForTimeout(500); // Very short wait for immediate feedback
    
    const immediatelyAfter = await page.evaluate(() => {
      const messageElements = document.querySelectorAll('[style*="border-left"]');
      return {
        count: messageElements.length,
        hasPendingIndicator: document.body.textContent?.includes('Sending...') || false,
        inputCleared: document.querySelector('input[type="text"]')?.value === ''
      };
    });
    
    console.log(`📊 送信直後メッセージ数: ${immediatelyAfter.count}`);
    console.log(`⏳ Sending表示: ${immediatelyAfter.hasPendingIndicator ? '✅' : '❌'}`);
    console.log(`🔄 入力クリア: ${immediatelyAfter.inputCleared ? '✅' : '❌'}`);
    
    const optimisticUISuccess = immediatelyAfter.count > beforeSend && immediatelyAfter.inputCleared;
    console.log(`🎯 Optimistic UI: ${optimisticUISuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Wait for server sync
    await page.waitForTimeout(8000);
    
    // Test 2: Auto-scroll behavior
    console.log('\n🧪 Test 2: Auto-scroll (自動スクロール)');
    
    // Send multiple messages to test scrolling
    for (let i = 1; i <= 3; i++) {
      const scrollTestMessage = `📜 Scroll test message ${i}/3`;
      await page.fill('input[type="text"]', scrollTestMessage);
      await page.waitForTimeout(500);
      
      console.log(`📤 スクロールテスト ${i}: "${scrollTestMessage}"`);
      await page.click('button');
      await page.waitForTimeout(2000); // Short wait between messages
    }
    
    console.log('⏰ 最終同期待機...');
    await page.waitForTimeout(10000);
    
    // Check final state and scroll position
    const finalState = await page.evaluate(() => {
      const messageElements = document.querySelectorAll('[style*="border-left"]');
      const messagesContainer = document.querySelector('div[style*="overflow: auto"]');
      
      // Check if scrolled to bottom (approximately)
      const scrolledToBottom = messagesContainer ? 
        Math.abs(messagesContainer.scrollTop + messagesContainer.clientHeight - messagesContainer.scrollHeight) < 50 :
        false;
      
      return {
        totalMessages: messageElements.length,
        scrolledToBottom,
        lastMessageText: Array.from(messageElements).pop()?.textContent?.substring(0, 50) || ''
      };
    });
    
    console.log(`📊 最終メッセージ数: ${finalState.totalMessages}`);
    console.log(`📜 最下部スクロール: ${finalState.scrolledToBottom ? '✅' : '❌'}`);
    console.log(`📝 最新メッセージ: "${finalState.lastMessageText}..."`);
    
    const uxSuccess = optimisticUISuccess && finalState.scrolledToBottom;
    console.log(`\n🏆 UX改善総合判定: ${uxSuccess ? '🎉 完全成功!' : '⚠️ 部分的改善'}`);
    
    await page.screenshot({ path: 'subchat-ux-improvements.png', fullPage: true });
    console.log('📸 UX改善結果: subchat-ux-improvements.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 UX関連ログ:');
    const relevantLogs = uxLogs.filter(log => 
      log.includes('pending') || log.includes('Pending:') || log.includes('scroll')
    ).slice(-8);
    
    if (relevantLogs.length > 0) {
      relevantLogs.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (UX関連ログなし)');
    }
  }
}

testUXImprovements().catch(console.error);
