const { chromium } = require('playwright-core');

async function simpleRealtimeTest() {
  console.log('🧪 簡単リアルタイム更新テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor key logs
  page.on('console', msg => {
    const text = msg.text();
    
    if (text.includes('🔄 Starting message polling') || 
        text.includes('📜 Refreshing messages') ||
        text.includes('Message count changed') ||
        text.includes('sessions') && text.includes('loaded') ||
        text.includes('ERROR') ||
        text.includes('Failed')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 SubChat アクセス...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(12000);
    
    // Check if sessions loaded
    const sessionsState = await page.evaluate(() => {
      const sessionElements = document.querySelectorAll('div[style*="cursor: pointer"][style*="padding: 8px"]');
      return {
        count: sessionElements.length,
        sessions: Array.from(sessionElements).map(el => el.textContent?.trim() || '').slice(0, 3)
      };
    });
    
    console.log(`📋 セッション読み込み: ${sessionsState.count}件`);
    
    if (sessionsState.count > 0) {
      console.log('✅ セッション一覧正常');
      sessionsState.sessions.forEach((session, i) => {
        console.log(`  ${i + 1}: ${session}`);
      });
      
      // Try to select first session
      console.log('🖱️ 最初のセッション選択...');
      await page.click('div[style*="cursor: pointer"][style*="padding: 8px"]:first-child');
      await page.waitForTimeout(8000);
      
      // Check if message polling started
      const messagesState = await page.evaluate(() => {
        const messageElements = document.querySelectorAll('[style*="border-left"]');
        const inputField = document.querySelector('input[type="text"]');
        const sendButton = document.querySelector('button:has-text("Send")');
        
        return {
          messageCount: messageElements.length,
          hasInput: !!inputField,
          hasSendButton: !!sendButton,
          inputEnabled: inputField && !inputField.disabled,
          sendEnabled: sendButton && !sendButton.disabled
        };
      });
      
      console.log('💬 メッセージ状態:');
      console.log(`  - メッセージ数: ${messagesState.messageCount}`);
      console.log(`  - 入力フィールド: ${messagesState.hasInput ? '✅' : '❌'}`);
      console.log(`  - Sendボタン: ${messagesState.hasSendButton ? '✅' : '❌'}`);
      console.log(`  - 入力有効: ${messagesState.inputEnabled ? '✅' : '❌'}`);
      
      if (messagesState.hasInput && messagesState.inputEnabled) {
        console.log('📤 簡単なテストメッセージ送信...');
        
        const testMessage = `⚡ Quick test ${new Date().toLocaleTimeString()}`;
        await page.fill('input[type="text"]', testMessage);
        await page.waitForTimeout(1000);
        
        console.log(`送信: "${testMessage}"`);
        await page.click('button');  // Click any button (should be Send)
        
        console.log('⏰ 更新確認 (10秒)...');
        await page.waitForTimeout(10000);
        
        // Check if message appeared
        const finalCount = await page.evaluate(() => {
          const messageElements = document.querySelectorAll('[style*="border-left"]');
          return messageElements.length;
        });
        
        const updateWorked = finalCount > messagesState.messageCount;
        console.log(`🎯 リアルタイム更新: ${updateWorked ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`📊 ${messagesState.messageCount} → ${finalCount} メッセージ`);
      }
    } else {
      console.log('❌ セッション読み込み失敗');
    }
    
    await page.screenshot({ path: 'subchat-simple-realtime-test.png' });
    console.log('📸 結果: subchat-simple-realtime-test.png');
    
  } catch (error) {
    console.log('❌ エラー:', error.message);
  } finally {
    await browser.close();
  }
}

simpleRealtimeTest().catch(console.error);
