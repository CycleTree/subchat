const { chromium } = require('playwright-core');

async function testRefactoredSubChat() {
  console.log('🚀 完全リファクタ版SubChatテスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor performance and UI logs
  const performanceLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    performanceLogs.push(text);
    
    if (text.includes('render') || text.includes('Rendering') ||
        text.includes('💬 handleSendMessage') ||
        text.includes('⚡') ||
        text.includes('ChatView render')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 リファクタ版アクセス (port 3000)...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(8000);
    
    await page.screenshot({ path: 'refactored-subchat-loaded.png', fullPage: true });
    console.log('📸 読み込み完了: refactored-subchat-loaded.png');
    
    // Check UI elements
    const uiState = await page.evaluate(() => {
      return {
        hasMainContainer: !!document.querySelector('[class*="main-container"]'),
        hasChatContainer: !!document.querySelector('[class*="chat-container"]'),
        hasMessageList: !!document.querySelector('[class*="message-list"]'),
        hasMessageInput: !!document.querySelector('[class*="message-input"]'),
        sessionElements: document.querySelectorAll('div[style*="cursor: pointer"]').length,
        connectButton: !!document.querySelector('button:has-text("Reload")'),
        visible: document.body.style.visibility !== 'hidden'
      };
    });
    
    console.log('🎨 リファクタ版UI状態:');
    console.log(`  - MainContainer: ${uiState.hasMainContainer ? '✅' : '❌'}`);
    console.log(`  - ChatContainer: ${uiState.hasChatContainer ? '✅' : '❌'}`);
    console.log(`  - MessageList: ${uiState.hasMessageList ? '✅' : '❌'}`);
    console.log(`  - MessageInput: ${uiState.hasMessageInput ? '✅' : '❌'}`);
    console.log(`  - Session要素: ${uiState.sessionElements}個`);
    
    // Try to select a session
    if (uiState.sessionElements > 0) {
      console.log('🖱️ セッション選択テスト...');
      
      // Select main1 if available
      try {
        await page.click('text=main1');
        await page.waitForTimeout(6000);
        
        await page.screenshot({ path: 'refactored-subchat-session-selected.png', fullPage: true });
        console.log('📸 セッション選択後: refactored-subchat-session-selected.png');
        
        // Test message input
        const messageInputState = await page.evaluate(() => {
          const messageInput = document.querySelector('[class*="message-input"] input') ||
                              document.querySelector('[class*="message-input"] textarea') ||
                              document.querySelector('input[placeholder*="message"]') ||
                              document.querySelector('textarea[placeholder*="message"]');
          
          return {
            hasInput: !!messageInput,
            inputType: messageInput?.tagName,
            placeholder: messageInput?.placeholder || '',
            disabled: messageInput?.disabled || false
          };
        });
        
        console.log('📝 メッセージ入力状態:');
        console.log(`  - 入力要素: ${messageInputState.hasInput ? '✅' : '❌'} (${messageInputState.inputType})`);
        console.log(`  - プレースホルダ: "${messageInputState.placeholder}"`);
        console.log(`  - 入力可能: ${!messageInputState.disabled ? '✅' : '❌'}`);
        
        if (messageInputState.hasInput) {
          console.log('💬 リファクタ版メッセージ送信テスト...');
          
          const testMessage = '🚀 Refactored UI Test!';
          
          // Type in the message input
          const inputSelector = '[class*="message-input"] input, [class*="message-input"] textarea, input[placeholder*="message"], textarea[placeholder*="message"]';
          await page.fill(inputSelector, testMessage);
          await page.waitForTimeout(1000);
          
          console.log(`📤 送信: "${testMessage}"`);
          
          // Press Enter to send (common pattern for message inputs)
          await page.press(inputSelector, 'Enter');
          
          console.log('⚡ 送信処理確認 (5秒)...');
          await page.waitForTimeout(5000);
          
          const finalState = await page.evaluate(() => {
            const input = document.querySelector('[class*="message-input"] input') ||
                         document.querySelector('[class*="message-input"] textarea') ||
                         document.querySelector('input[placeholder*="message"]') ||
                         document.querySelector('textarea[placeholder*="message"]');
            
            return {
              inputCleared: input?.value === '',
              messageElements: document.querySelectorAll('[class*="message"]').length
            };
          });
          
          console.log(`🔄 入力クリア: ${finalState.inputCleared ? '✅' : '❌'}`);
          console.log(`📊 メッセージ要素数: ${finalState.messageElements}`);
        }
        
      } catch (sessionError) {
        console.log('⚠️ セッション選択エラー:', sessionError.message);
      }
    } else {
      console.log('⚠️ セッション要素が見つかりません');
    }
    
    await page.screenshot({ path: 'refactored-subchat-final.png', fullPage: true });
    console.log('📸 最終結果: refactored-subchat-final.png');
    
    console.log('\n🎯 リファクタ版評価:');
    console.log(`  - UI構造: ${uiState.hasMainContainer && uiState.hasChatContainer ? '✅ 専用ライブラリ' : '❌ 基本構造'}`);
    console.log(`  - パフォーマンス: 詳細ログで確認`);
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 パフォーマンス関連ログ:');
    const performanceRelevant = performanceLogs.filter(log => 
      log.includes('render') || log.includes('Rendering') || 
      log.includes('ChatView render')
    ).slice(-8);
    
    if (performanceRelevant.length > 0) {
      performanceRelevant.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (パフォーマンスログなし - 最適化済み可能性)');
    }
  }
}

testRefactoredSubChat().catch(console.error);
