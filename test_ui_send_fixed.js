const { chromium } = require('playwright-core');

async function testUISendFixed() {
  console.log('🔍 Subchat UI Send機能テスト (修正版)...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor send-related logs
  const sendLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    
    if (text.includes('Sending message') || 
        text.includes('chat.send') ||
        text.includes('sendMessage') ||
        text.includes('Message sent') ||
        text.includes('Failed to send')) {
      sendLogs.push(text);
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 Subchatアプリアクセス...');
    await page.goto('http://localhost:3000');
    
    console.log('⏰ セッション読み込み待機...');
    await page.waitForTimeout(10000);
    
    console.log('🖱️ セッション選択 (Agent 1)...');
    
    // Find and click Agent 1 session (main1)
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
    
    if (sessionClicked) {
      console.log(`✅ セッション選択: ${sessionClicked}`);
    } else {
      console.log('❌ セッション選択失敗');
      return;
    }
    
    console.log('⏰ セッション読み込み待機...');
    await page.waitForTimeout(8000);
    
    // Check if send form is visible using improved selectors
    const sendFormStatus = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      
      // Find send button by looking for buttons with "Send" text
      let sendButton = null;
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent.includes('Send')) {
          sendButton = button;
          break;
        }
      }
      
      return {
        hasInput: !!input,
        hasSendButton: !!sendButton,
        inputDisabled: input?.disabled || false,
        sendButtonDisabled: sendButton?.disabled || false,
        inputPlaceholder: input?.placeholder || 'No placeholder',
        sendButtonText: sendButton?.textContent || 'No send button'
      };
    });
    
    console.log('📝 Send フォーム状態:');
    console.log(`  - 入力フィールド: ${sendFormStatus.hasInput ? '✅' : '❌'}`);
    console.log(`  - Sendボタン: ${sendFormStatus.hasSendButton ? '✅' : '❌'} ("${sendFormStatus.sendButtonText}")`);
    console.log(`  - 入力有効: ${!sendFormStatus.inputDisabled ? '✅' : '❌'}`);
    console.log(`  - ボタン有効: ${!sendFormStatus.sendButtonDisabled ? '✅' : '❌'}`);
    console.log(`  - プレースホルダ: "${sendFormStatus.inputPlaceholder}"`);
    
    if (sendFormStatus.hasInput && !sendFormStatus.inputDisabled) {
      console.log('💬 テストメッセージ入力...');
      
      const testMessage = `🧪 UI Test from Subchat at ${new Date().toLocaleTimeString()}`;
      
      await page.fill('input[type="text"]', testMessage);
      await page.waitForTimeout(1000);
      
      console.log(`📤 メッセージ送信: "${testMessage}"`);
      
      // Click send button using Playwright selector
      if (sendFormStatus.hasSendButton && !sendFormStatus.sendButtonDisabled) {
        // Use text-based selector in Playwright
        await page.click('button:has-text("Send")');
        console.log('✅ Sendボタンクリック');
        
        // Wait for send process
        await page.waitForTimeout(10000);
        
        // Check if input was cleared (indicates successful send)
        const inputValueAfterSend = await page.inputValue('input[type="text"]');
        
        console.log(`📋 送信後入力値: "${inputValueAfterSend}"`);
        
        const sendSuccess = inputValueAfterSend === '';
        console.log(`🎯 Send成功判定: ${sendSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        
      } else {
        console.log('❌ Sendボタンが無効またはなし');
      }
    } else {
      console.log('❌ 入力フィールドが無効またはなし');
    }
    
    await page.screenshot({ path: 'subchat-send-test.png' });
    console.log('📸 Send機能テスト結果: subchat-send-test.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 Send関連ログ:');
    if (sendLogs.length > 0) {
      sendLogs.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (Send関連ログなし)');
    }
  }
}

testUISendFixed().catch(console.error);
