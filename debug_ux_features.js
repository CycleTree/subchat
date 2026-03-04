const { chromium } = require('playwright-core');

async function debugUXFeatures() {
  console.log('🔍 UX機能デバッグ...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Log all console messages
  page.on('console', msg => {
    console.log(`🔍 ${msg.text()}`);
  });
  
  try {
    console.log('📡 SubChatアプリアクセス...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(8000);
    
    await page.screenshot({ path: 'debug-1-loaded.png' });
    console.log('📸 読み込み後: debug-1-loaded.png');
    
    // Check session list state
    const sessionsState = await page.evaluate(() => {
      const sessionElements = document.querySelectorAll('div[style*="cursor: pointer"][style*="padding: 8px"]');
      return {
        sessionCount: sessionElements.length,
        sessionTexts: Array.from(sessionElements).map(el => el.textContent?.trim()).slice(0, 3)
      };
    });
    
    console.log('📋 セッション状態:', sessionsState);
    
    if (sessionsState.sessionCount > 0) {
      console.log('🖱️ 最初のセッション選択...');
      await page.click('div[style*="cursor: pointer"][style*="padding: 8px"]:first-child');
      await page.waitForTimeout(6000);
      
      await page.screenshot({ path: 'debug-2-session-selected.png' });
      console.log('📸 セッション選択後: debug-2-session-selected.png');
      
      // Check message display state
      const messageState = await page.evaluate(() => {
        const messageElements = document.querySelectorAll('[style*="border-left"]');
        const inputField = document.querySelector('input[type="text"]');
        const sendButton = document.querySelector('button');
        
        return {
          messageCount: messageElements.length,
          hasInput: !!inputField,
          hasSendButton: !!sendButton,
          inputValue: inputField?.value || '',
          inputDisabled: inputField?.disabled || false,
          sendDisabled: sendButton?.disabled || false,
          containerHeight: document.querySelector('div[style*="overflow: auto"]')?.clientHeight || 0,
          bodyText: document.body.textContent?.substring(0, 200) || ''
        };
      });
      
      console.log('💬 メッセージ表示状態:');
      console.log(`  - メッセージ数: ${messageState.messageCount}`);
      console.log(`  - 入力フィールド: ${messageState.hasInput ? '✅' : '❌'}`);
      console.log(`  - Sendボタン: ${messageState.hasSendButton ? '✅' : '❌'}`);
      console.log(`  - 入力有効: ${!messageState.inputDisabled ? '✅' : '❌'}`);
      console.log(`  - Send有効: ${!messageState.sendDisabled ? '✅' : '❌'}`);
      console.log(`  - コンテナ高さ: ${messageState.containerHeight}px`);
      
      if (messageState.hasInput && !messageState.inputDisabled) {
        console.log('📝 簡単メッセージ送信テスト...');
        
        const simpleMessage = 'UX debug test';
        await page.fill('input[type="text"]', simpleMessage);
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'debug-3-message-typed.png' });
        console.log('📸 メッセージ入力後: debug-3-message-typed.png');
        
        // Check if send button is enabled after typing
        const sendStateAfterTyping = await page.evaluate(() => {
          const sendButton = document.querySelector('button');
          const input = document.querySelector('input[type="text"]');
          return {
            sendEnabled: sendButton && !sendButton.disabled,
            inputValue: input?.value || '',
            debugInfo: document.querySelector('div[style*="font-size: 10px"]')?.textContent || ''
          };
        });
        
        console.log(`📊 入力後Send状態: ${sendStateAfterTyping.sendEnabled ? '✅' : '❌'}`);
        console.log(`📝 入力値: "${sendStateAfterTyping.inputValue}"`);
        console.log(`🔍 Debug情報: ${sendStateAfterTyping.debugInfo}`);
      }
    }
    
  } catch (error) {
    console.log('❌ デバッグエラー:', error.message);
  } finally {
    await browser.close();
  }
}

debugUXFeatures().catch(console.error);
