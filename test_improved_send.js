const { chromium } = require('playwright-core');

async function testImprovedSend() {
  console.log('🔍 改良版Send機能テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor all console logs for debugging
  const allLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    allLogs.push(text);
    
    if (text.includes('DEBUG:') || 
        text.includes('Send') ||
        text.includes('input') ||
        text.includes('onChange') ||
        text.includes('button clicked') ||
        text.includes('message') && (text.includes('send') || text.includes('Send'))) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 Subchatアプリアクセス (改良版: port 3001)...');
    await page.goto('http://localhost:3001');
    
    console.log('⏰ セッション読み込み待機...');
    await page.waitForTimeout(12000);
    
    console.log('🖱️ セッション選択...');
    
    // Select Agent 1 session
    const sessionClicked = await page.evaluate(() => {
      const sessionElements = document.querySelectorAll('div[style*="cursor: pointer"][style*="padding: 8px"]');
      for (const element of sessionElements) {
        if (element.textContent.includes('main1') || element.textContent.includes('agent:1')) {
          element.click();
          return element.textContent.trim();
        }
      }
      // Fallback: click first session
      if (sessionElements.length > 0) {
        sessionElements[0].click();
        return sessionElements[0].textContent.trim();
      }
      return null;
    });
    
    console.log(`✅ セッション選択: ${sessionClicked}`);
    
    console.log('⏰ セッション詳細読み込み待機...');
    await page.waitForTimeout(10000);
    
    // Check the current send form state
    const formState = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      const sendButton = document.querySelector('button:has-text("Send")') || 
                        document.querySelectorAll('button').find(btn => btn.textContent.includes('Send'));
      const debugInfo = document.querySelector('div').textContent;
      
      return {
        hasInput: !!input,
        hasSendButton: !!sendButton,
        inputValue: input?.value || '',
        inputDisabled: input?.disabled || false,
        sendButtonDisabled: sendButton?.disabled || false,
        sendButtonText: sendButton?.textContent || 'No send button',
        debugText: debugInfo.includes('DEBUG:') ? 
          debugInfo.substring(debugInfo.indexOf('DEBUG:'), debugInfo.indexOf('DEBUG:') + 100) : 
          'No debug info'
      };
    });
    
    console.log('📝 改良版フォーム状態:');
    console.log(`  - 入力フィールド: ${formState.hasInput ? '✅' : '❌'}`);
    console.log(`  - Sendボタン: ${formState.hasSendButton ? '✅' : '❌'} ("${formState.sendButtonText}")`);
    console.log(`  - 入力値: "${formState.inputValue}"`);
    console.log(`  - 入力有効: ${!formState.inputDisabled ? '✅' : '❌'}`);
    console.log(`  - ボタン有効: ${!formState.sendButtonDisabled ? '✅' : '❌'}`);
    console.log(`  - Debug情報: ${formState.debugText}`);
    
    if (formState.hasInput && !formState.inputDisabled) {
      console.log('💬 改良版テストメッセージ入力...');
      
      const testMessage = `🚀 Enhanced UI Test from Subchat at ${new Date().toLocaleTimeString()}`;
      
      // Clear input first, then type
      await page.fill('input[type="text"]', '');
      await page.waitForTimeout(500);
      await page.type('input[type="text"]', testMessage);
      await page.waitForTimeout(2000);
      
      console.log(`📤 メッセージ送信: "${testMessage}"`);
      
      // Check button state after typing
      const buttonStateAfterTyping = await page.evaluate(() => {
        const sendButton = document.querySelectorAll('button').find(btn => btn.textContent.includes('Send'));
        const input = document.querySelector('input[type="text"]');
        return {
          buttonDisabled: sendButton?.disabled || false,
          buttonText: sendButton?.textContent || '',
          inputValue: input?.value || '',
          inputLength: input?.value?.length || 0
        };
      });
      
      console.log('📊 入力後ボタン状態:');
      console.log(`  - ボタン有効: ${!buttonStateAfterTyping.buttonDisabled ? '✅' : '❌'}`);
      console.log(`  - ボタンテキスト: "${buttonStateAfterTyping.buttonText}"`);
      console.log(`  - 入力値: "${buttonStateAfterTyping.inputValue}"`);
      console.log(`  - 入力長さ: ${buttonStateAfterTyping.inputLength}`);
      
      if (!buttonStateAfterTyping.buttonDisabled) {
        console.log('🖱️ Sendボタンクリック...');
        await page.click('button:has-text("Send")');
        console.log('✅ Sendボタンクリック完了');
        
        // Wait for send process and check result
        console.log('⏰ 送信処理待機...');
        await page.waitForTimeout(15000);
        
        // Check if input was cleared and message was sent
        const finalState = await page.evaluate(() => {
          const input = document.querySelector('input[type="text"]');
          const messageElements = document.querySelectorAll('div[style*="border-left"]');
          
          // Look for our test message in the messages
          let foundTestMessage = false;
          for (const element of messageElements) {
            if (element.textContent.includes('Enhanced UI Test from Subchat')) {
              foundTestMessage = true;
              break;
            }
          }
          
          return {
            inputValue: input?.value || '',
            messageCount: messageElements.length,
            foundTestMessage
          };
        });
        
        console.log('🎯 最終結果:');
        console.log(`  - 入力クリア: ${finalState.inputValue === '' ? '✅' : '❌'} ("${finalState.inputValue}")`);
        console.log(`  - メッセージ数: ${finalState.messageCount}`);
        console.log(`  - テストメッセージ検出: ${finalState.foundTestMessage ? '✅' : '❌'}`);
        
        const sendSuccess = finalState.inputValue === '' && finalState.foundTestMessage;
        console.log(`\n🏆 SEND機能総合判定: ${sendSuccess ? '✅ COMPLETE SUCCESS' : '❌ PARTIAL/FAILED'}`);
        
      } else {
        console.log('❌ 入力後もSendボタンが無効');
      }
    } else {
      console.log('❌ 入力フィールドが無効');
    }
    
    await page.screenshot({ path: 'subchat-send-enhanced.png' });
    console.log('📸 改良版Send機能結果: subchat-send-enhanced.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 デバッグログサンプル:');
    const debugLogs = allLogs.filter(log => 
      log.includes('DEBUG:') || log.includes('ChatView') || log.includes('onChange')
    ).slice(-10);
    
    if (debugLogs.length > 0) {
      debugLogs.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (デバッグログなし)');
    }
  }
}

testImprovedSend().catch(console.error);
